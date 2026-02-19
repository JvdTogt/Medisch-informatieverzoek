
import React from 'react';

interface InputSectionProps {
  title: string;
  description: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

const InputSection: React.FC<InputSectionProps> = ({ title, description, children, icon }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:border-blue-300 transition-colors">
      <div className="flex items-center gap-3 mb-4">
        {icon && <div className="text-blue-600">{icon}</div>}
        <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
      </div>
      <p className="text-sm text-slate-500 mb-4">{description}</p>
      {children}
    </div>
  );
};

export default InputSection;
