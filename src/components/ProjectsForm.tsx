import React from 'react';
import { Project } from '../types/resume';
import { FolderOpen, Plus, Trash2, Calendar, ExternalLink } from 'lucide-react';

interface ProjectsFormProps {
  data: Project[];
  onChange: (data: Project[]) => void;
}

export default function ProjectsForm({ data, onChange }: ProjectsFormProps) {
  const addProject = () => {
    const newProject: Project = {
      id: Date.now().toString(),
      name: '',
      description: '',
      technologies: [''],
      url: '',
      startDate: '',
      endDate: ''
    };
    onChange([...data, newProject]);
  };

  const updateProject = (id: string, field: keyof Project, value: any) => {
    onChange(data.map(project => 
      project.id === id ? { ...project, [field]: value } : project
    ));
  };

  const removeProject = (id: string) => {
    onChange(data.filter(project => project.id !== id));
  };

  const addTechnology = (projectId: string) => {
    const project = data.find(p => p.id === projectId);
    if (project) {
      updateProject(projectId, 'technologies', [...project.technologies, '']);
    }
  };

  const updateTechnology = (projectId: string, index: number, value: string) => {
    const project = data.find(p => p.id === projectId);
    if (project) {
      const newTechnologies = [...project.technologies];
      newTechnologies[index] = value;
      updateProject(projectId, 'technologies', newTechnologies);
    }
  };

  const removeTechnology = (projectId: string, index: number) => {
    const project = data.find(p => p.id === projectId);
    if (project && project.technologies.length > 1) {
      const newTechnologies = project.technologies.filter((_, i) => i !== index);
      updateProject(projectId, 'technologies', newTechnologies);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <FolderOpen className="w-5 h-5 text-sexy-pink-600" />
          <h2 className="text-xl font-semibold text-gray-900">Projects</h2>
        </div>
        <button
          onClick={addProject}
          className="flex items-center space-x-2 px-4 py-2 bg-sexy-pink-600 text-white rounded-lg hover:bg-sexy-pink-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Project</span>
        </button>
      </div>

      <div className="space-y-6">
        {data.map((project) => (
          <div key={project.id} className="border border-gray-200 rounded-lg p-6 relative">
            <button
              onClick={() => removeProject(project.id)}
              className="absolute top-4 right-4 text-red-500 hover:text-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={project.name}
                  onChange={(e) => updateProject(project.id, 'name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sexy-pink-500 focus:border-transparent"
                  placeholder="E-commerce Website"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <ExternalLink className="w-4 h-4 inline mr-1" />
                  Project URL
                </label>
                <input
                  type="url"
                  value={project.url || ''}
                  onChange={(e) => updateProject(project.id, 'url', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sexy-pink-500 focus:border-transparent"
                  placeholder="https://github.com/username/project"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Start Date *
                </label>
                <input
                  type="month"
                  value={project.startDate}
                  onChange={(e) => updateProject(project.id, 'startDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sexy-pink-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date *
                </label>
                <input
                  type="month"
                  value={project.endDate}
                  onChange={(e) => updateProject(project.id, 'endDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sexy-pink-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Description *
              </label>
              <textarea
                value={project.description}
                onChange={(e) => updateProject(project.id, 'description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sexy-pink-500 focus:border-transparent resize-none"
                placeholder="Brief description of the project, its purpose, and your role..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Technologies Used
              </label>
              <div className="space-y-2">
                {project.technologies.map((tech, techIndex) => (
                  <div key={techIndex} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={tech}
                      onChange={(e) => updateTechnology(project.id, techIndex, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sexy-pink-500 focus:border-transparent"
                      placeholder="React, Node.js, MongoDB, etc."
                    />
                    {project.technologies.length > 1 && (
                      <button
                        onClick={() => removeTechnology(project.id, techIndex)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => addTechnology(project.id)}
                  className="text-sexy-pink-600 hover:text-sexy-pink-700 text-sm font-medium transition-colors"
                >
                  + Add Technology
                </button>
              </div>
            </div>
          </div>
        ))}

        {data.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <FolderOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No projects added yet.</p>
            <p className="text-sm">Click "Add Project" to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}