import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PersonalInfoForm from '../PersonalInfoForm';
import { PersonalInfo } from '../../types/resume';

const mockPersonalInfo: PersonalInfo = {
  fullName: '',
  email: '',
  phone: '',
  location: '',
  linkedin: '',
  website: '',
  summary: '',
};

describe('PersonalInfoForm', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders all form fields', () => {
    render(<PersonalInfoForm data={mockPersonalInfo} onChange={mockOnChange} />);
    
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/linkedin/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/website/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/professional summary/i)).toBeInTheDocument();
  });

  it('displays existing data correctly', () => {
    const filledData: PersonalInfo = {
      fullName: 'John Doe',
      email: 'john@example.com',
      phone: '+1 (555) 123-4567',
      location: 'New York, NY',
      linkedin: 'https://linkedin.com/in/johndoe',
      website: 'https://johndoe.com',
      summary: 'Experienced software engineer',
    };

    render(<PersonalInfoForm data={filledData} onChange={mockOnChange} />);
    
    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('+1 (555) 123-4567')).toBeInTheDocument();
  });

  it('calls onChange when fields are updated', async () => {
    const user = userEvent.setup();
    render(<PersonalInfoForm data={mockPersonalInfo} onChange={mockOnChange} />);
    
    const nameInput = screen.getByLabelText(/full name/i);
    await user.type(nameInput, 'Jane Smith');
    
    expect(mockOnChange).toHaveBeenCalledWith({
      ...mockPersonalInfo,
      fullName: 'Jane Smith',
    });
  });

  it('validates email format', async () => {
    const user = userEvent.setup();
    render(<PersonalInfoForm data={mockPersonalInfo} onChange={mockOnChange} />);
    
    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, 'invalid-email');
    
    // Check if HTML5 validation is triggered
    expect(emailInput).toHaveAttribute('type', 'email');
  });

  it('shows character count for summary', () => {
    const dataWithSummary = {
      ...mockPersonalInfo,
      summary: 'This is a test summary',
    };
    
    render(<PersonalInfoForm data={dataWithSummary} onChange={mockOnChange} />);
    
    expect(screen.getByText(/22\/500 characters/i)).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<PersonalInfoForm data={mockPersonalInfo} onChange={mockOnChange} />);
    
    const nameInput = screen.getByLabelText(/full name/i);
    expect(nameInput).toHaveAttribute('aria-required', 'true');
    
    const emailInput = screen.getByLabelText(/email/i);
    expect(emailInput).toHaveAttribute('type', 'email');
    
    const summaryTextarea = screen.getByLabelText(/professional summary/i);
    expect(summaryTextarea).toHaveAttribute('rows', '4');
  });
});