import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TemplateSelector from '../TemplateSelector';
import { Resume } from '../../types/resume';
import { TemplateCustomization } from '../../types/template';

const mockResume: Resume = {
  id: '1',
  personalInfo: {
    fullName: 'John Doe',
    email: 'john@example.com',
    phone: '+1 (555) 123-4567',
    location: 'New York, NY',
    summary: 'Software engineer with 5 years of experience',
  },
  experience: [
    {
      id: '1',
      company: 'Tech Corp',
      position: 'Senior Developer',
      startDate: '2020-01',
      endDate: '2023-12',
      current: false,
      description: 'Led development team',
      achievements: ['Increased performance by 40%'],
    },
  ],
  education: [],
  skills: [
    {
      id: '1',
      name: 'JavaScript',
      level: 'Advanced',
      category: 'Technical',
    },
  ],
  projects: [],
  template: 'modern',
  createdAt: '2023-01-01',
  updatedAt: '2023-01-01',
};

const mockCustomizations: TemplateCustomization = {
  templateId: 'modern',
  font: 'Inter',
  accentColor: '#d946ef',
  sectionOrder: ['personalInfo', 'experience', 'education', 'skills', 'projects'],
  hideEmptySections: true,
};

describe('TemplateSelector', () => {
  const mockOnTemplateChange = vi.fn();

  beforeEach(() => {
    mockOnTemplateChange.mockClear();
  });

  it('renders all available templates', () => {
    render(
      <TemplateSelector
        resume={mockResume}
        selectedTemplate="modern"
        onTemplateChange={mockOnTemplateChange}
        customizations={mockCustomizations}
      />
    );
    
    expect(screen.getByText('Modern Professional')).toBeInTheDocument();
    expect(screen.getByText('Classic Professional')).toBeInTheDocument();
    expect(screen.getByText('Creative Portfolio')).toBeInTheDocument();
    expect(screen.getByText('Minimal Clean')).toBeInTheDocument();
    expect(screen.getByText('Executive Leadership')).toBeInTheDocument();
  });

  it('shows AI recommendations when resume has content', () => {
    render(
      <TemplateSelector
        resume={mockResume}
        selectedTemplate="modern"
        onTemplateChange={mockOnTemplateChange}
        customizations={mockCustomizations}
      />
    );
    
    expect(screen.getByText('AI Recommendations')).toBeInTheDocument();
  });

  it('highlights selected template', () => {
    render(
      <TemplateSelector
        resume={mockResume}
        selectedTemplate="modern"
        onTemplateChange={mockOnTemplateChange}
        customizations={mockCustomizations}
      />
    );
    
    const modernTemplate = screen.getByText('Modern Professional').closest('div');
    expect(modernTemplate).toHaveClass('border-sexy-pink-500');
  });

  it('calls onTemplateChange when template is selected', async () => {
    const user = userEvent.setup();
    render(
      <TemplateSelector
        resume={mockResume}
        selectedTemplate="modern"
        onTemplateChange={mockOnTemplateChange}
        customizations={mockCustomizations}
      />
    );
    
    const classicTemplate = screen.getByText('Classic Professional').closest('div');
    await user.click(classicTemplate!);
    
    expect(mockOnTemplateChange).toHaveBeenCalledWith('classic');
  });

  it('shows customization panel when customize button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <TemplateSelector
        resume={mockResume}
        selectedTemplate="modern"
        onTemplateChange={mockOnTemplateChange}
        customizations={mockCustomizations}
      />
    );
    
    const customizeButton = screen.getByText('Customize');
    await user.click(customizeButton);
    
    expect(screen.getByText('Customize Template')).toBeInTheDocument();
    expect(screen.getByText('Font Family')).toBeInTheDocument();
    expect(screen.getByText('Accent Color')).toBeInTheDocument();
  });

  it('updates customizations when options are changed', async () => {
    const user = userEvent.setup();
    render(
      <TemplateSelector
        resume={mockResume}
        selectedTemplate="modern"
        onTemplateChange={mockOnTemplateChange}
        customizations={mockCustomizations}
      />
    );
    
    // Open customization panel
    await user.click(screen.getByText('Customize'));
    
    // Change font
    const fontSelect = screen.getByDisplayValue('Inter');
    await user.selectOptions(fontSelect, 'Roboto');
    
    expect(mockOnTemplateChange).toHaveBeenCalledWith('modern', {
      font: 'Roboto',
    });
  });
});