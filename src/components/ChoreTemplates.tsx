import React, { useState } from 'react';
import { ChoreFormData } from '../types';
import './ChoreTemplates.css';

interface ChoreTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  isRecurring: boolean;
  recurrencePattern?: 'daily' | 'weekly' | 'monthly';
  icon: string;
  color: string;
}

interface ChoreTemplatesProps {
  onTemplateSelect: (template: ChoreFormData) => void;
  onClose: () => void;
  open: boolean;
}

const templates: ChoreTemplate[] = [
  {
    id: 'daily-cleaning',
    title: 'Daily Cleaning',
    description: 'Basic daily household cleaning tasks',
    category: 'cleaning',
    priority: 'medium',
    isRecurring: true,
    recurrencePattern: 'daily',
    icon: '🧹',
    color: 'cleaning'
  },
  {
    id: 'weekly-laundry',
    title: 'Weekly Laundry',
    description: 'Wash, dry, and fold all clothes',
    category: 'laundry',
    priority: 'medium',
    isRecurring: true,
    recurrencePattern: 'weekly',
    icon: '👕',
    color: 'laundry'
  },
  {
    id: 'grocery-shopping',
    title: 'Grocery Shopping',
    description: 'Buy ingredients for weekly meals',
    category: 'shopping',
    priority: 'high',
    isRecurring: true,
    recurrencePattern: 'weekly',
    icon: '🛒',
    color: 'shopping'
  },
  {
    id: 'meal-prep',
    title: 'Meal Preparation',
    description: 'Prepare meals for the week',
    category: 'cooking',
    priority: 'medium',
    isRecurring: true,
    recurrencePattern: 'weekly',
    icon: '🍳',
    color: 'cooking'
  },
  {
    id: 'garden-maintenance',
    title: 'Garden Maintenance',
    description: 'Water plants and garden upkeep',
    category: 'garden',
    priority: 'low',
    isRecurring: true,
    recurrencePattern: 'weekly',
    icon: '🌱',
    color: 'garden'
  },
  {
    id: 'bathroom-cleaning',
    title: 'Bathroom Cleaning',
    description: 'Deep clean bathroom surfaces',
    category: 'cleaning',
    priority: 'medium',
    isRecurring: true,
    recurrencePattern: 'weekly',
    icon: '🚿',
    color: 'cleaning'
  },
  {
    id: 'kitchen-cleaning',
    title: 'Kitchen Deep Clean',
    description: 'Clean appliances and surfaces',
    category: 'cleaning',
    priority: 'medium',
    isRecurring: true,
    recurrencePattern: 'weekly',
    icon: '🍽️',
    color: 'cleaning'
  },
  {
    id: 'bill-payment',
    title: 'Bill Payment',
    description: 'Pay monthly bills and utilities',
    category: 'shopping',
    priority: 'high',
    isRecurring: true,
    recurrencePattern: 'monthly',
    icon: '💰',
    color: 'shopping'
  },
  {
    id: 'home-maintenance',
    title: 'Home Maintenance',
    description: 'General home repairs and maintenance',
    category: 'maintenance',
    priority: 'high',
    isRecurring: false,
    icon: '🔧',
    color: 'maintenance'
  },
  {
    id: 'organize-closet',
    title: 'Organize Closet',
    description: 'Sort and organize clothing',
    category: 'cleaning',
    priority: 'low',
    isRecurring: false,
    icon: '👔',
    color: 'cleaning'
  },
  {
    id: 'vacuum-house',
    title: 'Vacuum House',
    description: 'Vacuum all rooms and furniture',
    category: 'cleaning',
    priority: 'medium',
    isRecurring: true,
    recurrencePattern: 'weekly',
    icon: '🧹',
    color: 'cleaning'
  },
  {
    id: 'take-out-trash',
    title: 'Take Out Trash',
    description: 'Empty all trash bins',
    category: 'cleaning',
    priority: 'high',
    isRecurring: true,
    recurrencePattern: 'weekly',
    icon: '🗑️',
    color: 'cleaning'
  }
];

export const ChoreTemplates: React.FC<ChoreTemplatesProps> = ({
  onTemplateSelect,
  onClose,
  open
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  if (!open) return null;

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(templates.map(t => t.category)));

  const handleTemplateClick = (template: ChoreTemplate) => {
    const formData: ChoreFormData = {
      title: template.title,
      description: template.description,
      category: template.category,
      priority: template.priority,
      isRecurring: template.isRecurring,
      recurrencePattern: template.recurrencePattern,
    };
    onTemplateSelect(formData);
    onClose();
  };

  return (
    <div className="templates-overlay" onClick={onClose}>
      <div className="templates-modal" onClick={e => e.stopPropagation()}>
        <div className="templates-header">
          <h2>📋 Chore Templates</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="templates-filters">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="template-search"
            />
            <span className="search-icon">🔍</span>
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="category-filter"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="templates-grid">
          {filteredTemplates.length === 0 ? (
            <div className="no-templates">
              <div className="no-templates-icon">🔍</div>
              <p>No templates found</p>
              <p>Try adjusting your search or category filter</p>
            </div>
          ) : (
            filteredTemplates.map(template => (
              <div
                key={template.id}
                className={`template-card ${template.color}`}
                onClick={() => handleTemplateClick(template)}
              >
                <div className="template-icon">{template.icon}</div>
                <div className="template-content">
                  <h3 className="template-title">{template.title}</h3>
                  <p className="template-description">{template.description}</p>
                  <div className="template-meta">
                    <span className={`priority-badge priority-${template.priority}`}>
                      {template.priority}
                    </span>
                    {template.isRecurring && (
                      <span className="recurring-badge">
                        🔄 {template.recurrencePattern}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}; 