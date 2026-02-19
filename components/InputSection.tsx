
import React from 'react';

interface InputSectionProps {
  title: string;
  description: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  step?: number;
}

const InputSection: React.FC<InputSectionProps> = ({ title, description, children, icon, step }) => {
  return (
    <div className="relative group animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
      {/* Decorative Step Indicator */}
      {step && (
        <div className="absolute -left-4 -top-4 w-10 h-10 bg-medical-600 text-white rounded-2xl flex items-center justify-center font-bold shadow-lg shadow-medical-200 z-10 border-4 border-white">
          {step}
        </div>
      )}
      
      <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100 group-hover:border-medical-200 group-hover:shadow-[0_20px_40px_rgba(14,145,233,0.05)] transition-all duration-500">
        <div className="flex items-center gap-5 mb-8">
          <div className="p-4 bg-medical-50 rounded-2xl text-medical-600 ring-4 ring-medical-50/50 group-hover:scale-110 transition-transform duration-500">
            {icon}
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">{title}</h3>
            <p className="text-slate-500 font-medium leading-relaxed mt-1">{description}</p>
          </div>
        </div>
        
        <div className="relative">
          {children}
        </div>
      </div>
    </div>
  );
};

export default InputSection;
