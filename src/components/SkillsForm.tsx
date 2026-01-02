import React, { useState, useEffect } from 'react';
import { Skill } from '../types/resume';
import { Zap, Plus, Trash2 } from 'lucide-react';

interface SkillsFormProps {
  initialData?: Skill[];
  onSave: (data: Skill[]) => void;
}

export default function SkillsForm({ initialData, onSave }: SkillsFormProps) {
  const [data, setData] = useState<Skill[]>(initialData || []);

  useEffect(() => {
    if (initialData) {
      setData(initialData);
    }
  }, [initialData]);

  const handleSave = () => {
    onSave(data);
  };

  const addSkill = () => {
    const newSkill: Skill = {
      id: Date.now().toString(),
      name: '',
      level: 'Intermediate',
      category: 'Technical'
    };
    setData([...data, newSkill]);
  };

  const updateSkill = (id: string, field: keyof Skill, value: any) => {
    setData(data.map(skill => 
      skill.id === id ? { ...skill, [field]: value } : skill
    ));
  };

  const removeSkill = (id: string) => {
    setData(data.filter(skill => skill.id !== id));
  };

  const skillsByCategory = data.reduce((acc, skill) => {
    if (!acc[skill.category]) {
      acc[skill.category] = [];
    }
    acc[skill.category].push(skill);
    return acc;
  }, {} as Record<string, Skill[]>);

  const getLevelColor = (level: Skill['level']) => {
    switch (level) {
      case 'Beginner': return 'bg-red-100 text-red-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-blue-100 text-blue-800';
      case 'Expert': return 'bg-sexy-cyan-100 text-sexy-cyan-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Zap className="w-5 h-5 text-sexy-pink-600" />
          <h2 className="text-xl font-semibold text-gray-900">Skills</h2>
        </div>
        <button
          onClick={addSkill}
          className="flex items-center space-x-2 px-4 py-2 bg-sexy-pink-600 text-white rounded-lg hover:bg-sexy-pink-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Skill</span>
        </button>
      </div>

      <div className="space-y-6">
        {data.map((skill) => (
          <div key={skill.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Skill Name *
                </label>
                <input
                  type="text"
                  value={skill.name}
                  onChange={(e) => updateSkill(skill.id, 'name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sexy-pink-500 focus:border-transparent"
                  placeholder="JavaScript, Leadership, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={skill.category}
                  onChange={(e) => updateSkill(skill.id, 'category', e.target.value as Skill['category'])}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sexy-pink-500 focus:border-transparent"
                >
                  <option value="Technical">Technical</option>
                  <option value="Soft">Soft Skills</option>
                  <option value="Language">Language</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Level
                </label>
                <select
                  value={skill.level}
                  onChange={(e) => updateSkill(skill.id, 'level', e.target.value as Skill['level'])}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sexy-pink-500 focus:border-transparent"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Expert">Expert</option>
                </select>
              </div>

              <div className="flex items-end">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getLevelColor(skill.level)}`}>
                  {skill.level}
                </span>
              </div>
            </div>

            <button
              onClick={() => removeSkill(skill.id)}
              className="text-red-500 hover:text-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}

        {data.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Zap className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No skills added yet.</p>
            <p className="text-sm">Click "Add Skill" to get started.</p>
          </div>
        )}
      </div>

      {data.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Skills by Category</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(skillsByCategory).map(([category, skills]) => (
              <div key={category} className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">{category}</h4>
                <div className="space-y-2">
                  {skills.map((skill) => (
                    <div key={skill.id} className="flex justify-between items-center">
                      <span className="text-gray-700">{skill.name}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getLevelColor(skill.level)}`}>
                        {skill.level}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
        >
          Save Skills
        </button>
      </div>
    </div>
  );
}
