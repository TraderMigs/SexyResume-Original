import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, PUT, DELETE, OPTIONS",
};

interface ParsedField {
  id: string;
  fieldName: string;
  originalValue: string;
  correctedValue: string;
  confidence: number;
  provenance?: {
    page?: number;
    line?: number;
    offset?: number;
    sourceText?: string;
  };
  status: "pending" | "validated" | "corrected" | "unknown";
  warnings: string[];
}

interface ParsedSection {
  id: string;
  sectionName: string;
  fields: ParsedField[];
  confidence: number;
  isEmpty: boolean;
  isVisible: boolean;
}

interface ValidationRequest {
  parseId: string;
  corrections: {
    fieldId: string;
    correctedValue: string;
    status: ParsedField["status"];
  }[];
}

type User = { id: string };

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getEnv(name: string) {
  const v = Deno.env.get(name);
  return v && v.trim().length > 0 ? v : null;
}

function buildSupabaseClient(req: Request) {
  const url = getEnv("SUPABASE_URL");
  const service = getEnv("SUPABASE_SERVICE_ROLE_KEY");
  const anon = getEnv("SUPABASE_ANON_KEY");

  if (!url) throw new Error("Missing SUPABASE_URL in Edge Function env");

  // Prefer service role if present (works even if RLS isn’t set up yet).
  // Fallback to anon for local/dev environments.
  const key = service ?? anon;
  if (!key) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) in Edge Function env",
    );
  }

  const authHeader = req.headers.get("Authorization") ?? "";

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
  });
}

async function requireUser(supabaseClient: any, req: Request): Promise<User> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) throw new Error("No authorization header");

  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabaseClient.auth.getUser(token);

  if (error || !data?.user) throw new Error("Unauthorized");
  return { id: data.user.id };
}

/**
 * Route parser that works for:
 * - /parse-review
 * - /parse-review/create
 * - /parse-review/validate
 * - /parse-review/:id
 * - /functions/v1/parse-review/...
 */
function parseRoute(reqUrl: string) {
  const url = new URL(reqUrl);
  const parts = url.pathname.split("/").filter(Boolean);

  // Find "parse-review" in the path anywhere
  const idx = parts.findIndex((p) => p === "parse-review");
  const after = idx >= 0 ? parts.slice(idx + 1) : [];

  // after[0] can be: undefined | "create" | "validate" | ":id"
  return {
    base: "parse-review",
    next: after[0] ?? null,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = buildSupabaseClient(req);
    const user = await requireUser(supabaseClient, req);

    const { next } = parseRoute(req.url);

    // ROUTES:
    // GET    /parse-review
    // POST   /parse-review/create
    // POST   /parse-review/validate
    // GET    /parse-review/:id
    // PUT    /parse-review/:id
    // DELETE /parse-review/:id

    if (req.method === "GET" && !next) {
      return await getUserParseReviews(supabaseClient, user);
    }

    if (req.method === "POST" && next === "create") {
      return await createParseReview(req, supabaseClient, user);
    }

    if (req.method === "POST" && next === "validate") {
      return await validateCorrections(req);
    }

    if (next && req.method === "GET") {
      return await getParseReview(next, supabaseClient, user);
    }

    if (next && req.method === "PUT") {
      return await updateParseReview(next, req, supabaseClient, user);
    }

    if (next && req.method === "DELETE") {
      return await deleteParseReview(next, supabaseClient, user);
    }

    return json(405, { error: "Method not allowed" });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    // IMPORTANT: keep it 200/4xx/5xx predictable. If we reach here, we return JSON.
    return json(400, { error: msg });
  }
});

async function createParseReview(req: Request, supabaseClient: any, user: User) {
  // Accept either:
  // A) multipart/form-data with "file"
  // B) application/json with { extractedText, fileName?, fileType? }
  let extractedText = "";
  let fileName = "resume";
  let fileType = "text/plain";
  let originalFileUrl: string | null = null;

  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) throw new Error("No file provided");

    fileName = file.name || "resume";
    fileType = file.type || "application/octet-stream";

    // NOTE: Deno PDF/Word extraction is unreliable.
    // If text/plain: read directly.
    // Otherwise: we fail fast with a clear message so the frontend can switch to client-side extraction.
    if (fileType === "text/plain") {
      extractedText = await file.text();
    } else {
      throw new Error(
        "File parsing in Edge Function is disabled. Please extract text client-side and send JSON (extractedText).",
      );
    }
  } else {
    const body = await req.json().catch(() => ({}));
    extractedText = String(body.extractedText ?? "").trim();
    fileName = String(body.fileName ?? "resume");
    fileType = String(body.fileType ?? "text/plain");
  }

  if (!extractedText || extractedText.length < 50) {
    throw new Error(
      "Could not extract sufficient text. Please upload a resume with readable text.",
    );
  }

  const parsedData = await parseResumeWithFieldAnalysis(extractedText, fileName);

  const parseReview = {
    id: crypto.randomUUID(),
    user_id: user.id,
    original_file_name: fileName,
    original_file_url: originalFileUrl,
    original_file_type: fileType,
    sections: parsedData.sections,
    overall_confidence: parsedData.overallConfidence,
    parse_version: "2.0",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    snapshots: [
      {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        sections: parsedData.sections,
        description: "Initial parse",
        isAutoSave: false,
      },
    ],
  };

  // Try DB save if table exists. If not, still return parseReview.
  try {
    const { error } = await supabaseClient
      .from("parse_reviews")
      .insert(parseReview);

    // If table missing, Supabase returns an error. We just continue.
    if (error) {
      console.warn("DB insert parse_reviews failed:", error?.message ?? error);
    }
  } catch (e) {
    console.warn("DB insert parse_reviews threw:", e);
  }

  return json(201, parseReview);
}

async function validateCorrections(req: Request) {
  const { corrections }: ValidationRequest = await req.json();

  const completenessScore = calculateCompletenessScore(corrections);

  return json(200, {
    updatedSections: [],
    overallConfidence: 0.85,
    completenessScore,
  });
}

function calculateCompletenessScore(corrections: any[]): number {
  const totalFields = corrections.length;
  const completedFields = corrections.filter((c) =>
    c.status === "validated" || c.status === "corrected"
  ).length;

  return totalFields > 0 ? completedFields / totalFields : 0;
}

async function getUserParseReviews(supabaseClient: any, user: User) {
  // If table exists, return actual records. Otherwise return [].
  try {
    const { data, error } = await supabaseClient
      .from("parse_reviews")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("DB select parse_reviews failed:", error?.message ?? error);
      return json(200, []);
    }

    return json(200, data ?? []);
  } catch (_e) {
    return json(200, []);
  }
}

async function getParseReview(reviewId: string, supabaseClient: any, user: User) {
  try {
    const { data, error } = await supabaseClient
      .from("parse_reviews")
      .select("*")
      .eq("id", reviewId)
      .eq("user_id", user.id)
      .single();

    if (error || !data) return json(404, { error: "Parse review not found" });
    return json(200, data);
  } catch (_e) {
    return json(404, { error: "Parse review not found" });
  }
}

async function updateParseReview(
  reviewId: string,
  req: Request,
  supabaseClient: any,
  user: User,
) {
  const updateData = await req.json();

  try {
    const { data, error } = await supabaseClient
      .from("parse_reviews")
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq("id", reviewId)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (error || !data) return json(404, { error: "Parse review not found" });
    return json(200, data);
  } catch (_e) {
    return json(404, { error: "Parse review not found" });
  }
}

async function deleteParseReview(
  reviewId: string,
  supabaseClient: any,
  user: User,
) {
  try {
    const { error } = await supabaseClient
      .from("parse_reviews")
      .delete()
      .eq("id", reviewId)
      .eq("user_id", user.id);

    if (error) return json(400, { error: error.message });
    return json(200, { message: "Parse review deleted successfully" });
  } catch (_e) {
    return json(200, { message: "Parse review deleted successfully" });
  }
}

async function parseResumeWithFieldAnalysis(text: string, _fileName: string) {
  const lines = text.split("\n").map((line, index) => ({
    text: line.trim(),
    lineNumber: index + 1,
  }));
  const nonEmptyLines = lines.filter((line) => line.text.length > 0);

  const sections: ParsedSection[] = [];

  // Personal Information
  const personalInfoFields: ParsedField[] = [];

  const emailMatch = text.match(
    /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
  );
  if (emailMatch) {
    const email = emailMatch[0];
    const emailLine = nonEmptyLines.find((line) => line.text.includes(email));
    personalInfoFields.push({
      id: "email",
      fieldName: "email",
      originalValue: email,
      correctedValue: email,
      confidence: 0.95,
      provenance: { line: emailLine?.lineNumber, sourceText: emailLine?.text },
      status: "pending",
      warnings: [],
    });
  } else {
    personalInfoFields.push({
      id: "email",
      fieldName: "email",
      originalValue: "",
      correctedValue: "",
      confidence: 0,
      status: "pending",
      warnings: ["No email address found in document"],
    });
  }

  const phoneMatch = text.match(
    /(\+?1?[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g,
  );
  if (phoneMatch) {
    const phone = phoneMatch[0];
    const phoneLine = nonEmptyLines.find((line) => line.text.includes(phone));
    personalInfoFields.push({
      id: "phone",
      fieldName: "phone",
      originalValue: phone,
      correctedValue: phone,
      confidence: 0.9,
      provenance: { line: phoneLine?.lineNumber, sourceText: phoneLine?.text },
      status: "pending",
      warnings: [],
    });
  } else {
    personalInfoFields.push({
      id: "phone",
      fieldName: "phone",
      originalValue: "",
      correctedValue: "",
      confidence: 0,
      status: "pending",
      warnings: ["No phone number found in document"],
    });
  }

  let nameField: ParsedField;
  if (nonEmptyLines.length > 0) {
    const firstLine = nonEmptyLines[0];
    const nameConfidence = calculateNameConfidence(firstLine.text);
    nameField = {
      id: "fullName",
      fieldName: "fullName",
      originalValue: firstLine.text,
      correctedValue: firstLine.text,
      confidence: nameConfidence,
      provenance: { line: firstLine.lineNumber, sourceText: firstLine.text },
      status: "pending",
      warnings: nameConfidence < 0.7 ? ["Name detection uncertain - verify"] : [],
    };
  } else {
    nameField = {
      id: "fullName",
      fieldName: "fullName",
      originalValue: "",
      correctedValue: "",
      confidence: 0,
      status: "pending",
      warnings: ["No name found in document"],
    };
  }
  personalInfoFields.unshift(nameField);

  personalInfoFields.push(
    {
      id: "location",
      fieldName: "location",
      originalValue: "",
      correctedValue: "",
      confidence: 0,
      status: "pending",
      warnings: ["Location not detected - add manually"],
    },
    {
      id: "summary",
      fieldName: "summary",
      originalValue: "",
      correctedValue: "",
      confidence: 0,
      status: "pending",
      warnings: ["Professional summary not detected - add manually"],
    },
  );

  sections.push({
    id: "personal-info",
    sectionName: "Personal Information",
    fields: personalInfoFields,
    confidence: personalInfoFields.reduce((sum, f) => sum + f.confidence, 0) /
      personalInfoFields.length,
    isEmpty: personalInfoFields.every((f) => !f.originalValue),
    isVisible: true,
  });

  // Skills
  const skillsFields: ParsedField[] = [];
  const commonSkills = [
    "JavaScript",
    "Python",
    "Java",
    "React",
    "Node.js",
    "SQL",
    "HTML",
    "CSS",
    "Git",
    "AWS",
    "Docker",
  ];
  const foundSkills = commonSkills.filter((skill) =>
    text.toLowerCase().includes(skill.toLowerCase())
  );

  if (foundSkills.length > 0) {
    skillsFields.push({
      id: "technical-skills",
      fieldName: "Technical Skills",
      originalValue: foundSkills.join(", "),
      correctedValue: foundSkills.join(", "),
      confidence: 0.8,
      status: "pending",
      warnings: foundSkills.length < 3
        ? ["Limited skills detected - add more"]
        : [],
    });
  } else {
    skillsFields.push({
      id: "technical-skills",
      fieldName: "Technical Skills",
      originalValue: "",
      correctedValue: "",
      confidence: 0,
      status: "pending",
      warnings: ["No technical skills detected"],
    });
  }

  sections.push({
    id: "skills",
    sectionName: "Skills",
    fields: skillsFields,
    confidence: skillsFields.reduce((sum, f) => sum + f.confidence, 0) /
      skillsFields.length,
    isEmpty: skillsFields.every((f) => !f.originalValue),
    isVisible: true,
  });

  const overallConfidence = sections.reduce((sum, s) => sum + s.confidence, 0) /
    sections.length;

  return { sections, overallConfidence };
}

function calculateNameConfidence(text: string): number {
  const words = text.split(/\s+/);

  if (words.length < 2 || words.length > 4) return 0.3;

  const hasCapitalization = words.every((word) => /^[A-Z][a-z]+$/.test(word));
  if (!hasCapitalization) return 0.4;

  const nonNameWords = [
    "resume",
    "cv",
    "curriculum",
    "vitae",
    "profile",
    "contact",
    "email",
    "phone",
  ];
  const hasNonNameWords = words.some((word) =>
    nonNameWords.includes(word.toLowerCase())
  );
  if (hasNonNameWords) return 0.2;

  return 0.85;
}
