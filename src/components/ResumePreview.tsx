import React from 'react';
import { Resume } from '../types/resume';
import { Mail, Phone, MapPin, Linkedin, Globe, Calendar } from 'lucide-react';

interface ResumePreviewProps {
  resume: Resume;
}

export default function ResumePreview({ resume }: ResumePreviewProps) {
  const { personalInfo, experience, education, skills, projects } = resume;

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString + '-01');
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  };

  const skillsByCategory = skills.reduce((acc, skill) => {
    if (!acc[skill.category]) {
      acc[skill.category] = [];
    }
    acc[skill.category].push(skill);
    return acc;
  }, {} as Record<string, typeof skills>);

  return (
    <div className="bg-white shadow-lg rounded-xl overflow-hidden">
      <div className="bg-gradient-to-r from-sexy-pink-600 to-sexy-cyan-600 text-white p-8">
        <h1 className="text-3xl font-bold mb-2">{personalInfo.fullName || 'Your Name'}</h1>
        <div className="flex flex-wrap gap-4 text-sexy-pink-100">
          {personalInfo.email && (
            <div className="flex items-center space-x-1">
              <Mail className="w-4 h-4" />
              <span className="text-sm">{personalInfo.email}</span>
            </div>
          )}
          {personalInfo.phone && (
            <div className="flex items-center space-x-1">
              <Phone className="w-4 h-4" />
              <span className="text-sm">{personalInfo.phone}</span>
            </div>
          )}
          {personalInfo.location && (
            <div className="flex items-center space-x-1">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">{personalInfo.location}</span>
            </div>
          )}
          {personalInfo.linkedin && (
            <div className="flex items-center space-x-1">
              <Linkedin className="w-4 h-4" />
              <span className="text-sm">LinkedIn</span>
            </div>
          )}
          {personalInfo.website && (
            <div className="flex items-center space-x-1">
              <Globe className="w-4 h-4" />
              <span className="text-sm">Portfolio</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-8 space-y-8">
        {personalInfo.summary && (
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3 border-b-2 border-sexy-pink-600 pb-1">
              Professional Summary
            </h2>
            <p className="text-gray-700 leading-relaxed">{personalInfo.summary}</p>
          </section>
        )}

        {experience.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 border-b-2 border-sexy-pink-600 pb-1">
              Work Experience
            </h2>
            <div className="space-y-6">
              {experience.map((exp) => (
                <div key={exp.id} className="relative pl-6 border-l-2 border-gray-200">
                  <div className="absolute -left-2 top-0 w-4 h-4 bg-sexy-pink-600 rounded-full"></div>
                  <div className="mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{exp.position}</h3>
                    <p className="text-sexy-pink-600 font-medium">{exp.company}</p>
                    <div className="flex items-center text-gray-500 text-sm mt-1">
                      <Calendar className="w-4 h-4 mr-1" />
                      <span>
                        {formatDate(exp.startDate)} - {exp.current ? 'Present' : formatDate(exp.endDate)}
                      </span>
                    </div>
                  </div>
                  {exp.description && (
                    <p className="text-gray-700 mb-3">{exp.description}</p>
                  )}
                  {exp.achievements.filter(a => a.trim()).length > 0 && (
                    <ul className="list-disc list-inside text-gray-700 space-y-1">
                      {exp.achievements.filter(a => a.trim()).map((achievement, index) => (
                        <li key={index}>{achievement}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {education.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 border-b-2 border-sexy-pink-600 pb-1">
              Education
            </h2>
            <div className="space-y-4">
              {education.map((edu) => (
                <div key={edu.id} className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {edu.degree} in {edu.field}
                    </h3>
                    <p className="text-sexy-pink-600 font-medium">{edu.institution}</p>
                    {edu.honors && (
                      <p className="text-gray-600 text-sm">{edu.honors}</p>
                    )}
                  </div>
                  <div className="text-right text-gray-500 text-sm">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      <span>{formatDate(edu.startDate)} - {formatDate(edu.endDate)}</span>
                    </div>
                    {edu.gpa && (
                      <p className="mt-1">GPA: {edu.gpa}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {skills.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 border-b-2 border-sexy-pink-600 pb-1">
              Skills
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(skillsByCategory).map(([category, categorySkills]) => (
                <div key={category}>
                  <h3 className="font-semibold text-gray-900 mb-2">{category}</h3>
                  <div className="flex flex-wrap gap-2">
                    {categorySkills.map((skill) => (
                      <span
                        key={skill.id}
                        className="px-3 py-1 bg-sexy-pink-100 text-sexy-pink-800 rounded-full text-sm font-medium"
                      >
                        {skill.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {projects && projects.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 border-b-2 border-sexy-pink-600 pb-1">
              Projects
            </h2>
            <div className="space-y-6">
              {projects.map((project) => (
                <div key={project.id} className="relative pl-6 border-l-2 border-gray-200">
                  <div className="absolute -left-2 top-0 w-4 h-4 bg-sexy-pink-600 rounded-full"></div>
                  <div className="mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                    <div className="flex items-center text-gray-500 text-sm mt-1">
                      <Calendar className="w-4 h-4 mr-1" />
                      <span>
                        {formatDate(project.startDate)} - {formatDate(project.endDate)}
                      </span>
                      {project.url && (
                        <>
                          <span className="mx-2">•</span>
                          <a 
                            href={project.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sexy-pink-600 hover:text-sexy-pink-700"
                          >
                            View Project
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                  {project.description && (
                    <p className="text-gray-700 mb-3">{project.description}</p>
                  )}
                  {project.technologies.filter(tech => tech.trim()).length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {project.technologies.filter(tech => tech.trim()).map((tech, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-sexy-cyan-100 text-sexy-cyan-800 rounded text-sm font-medium"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}