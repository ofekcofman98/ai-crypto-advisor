import { CheckCircle2 } from 'lucide-react';

interface Option {
    id: string;
    name: string;
    desc?: string;
}

interface SelectionGridProps {
    options: Option[] | string[];
    selectedValues: string[] | string;
    onSelect: (id: string) => void;
    columnsClassName?: string;
    accentColor?: 'primary' | 'secondary' | 'warning';
}


export default function SelectionGrid({
    options,
    selectedValues,
    onSelect,
    columnsClassName = 'grid-cols-2 sm:grid-cols-3',
    accentColor = 'primary',
}: SelectionGridProps) {
    
    const themeStyles = {
      primary: {
        border: 'border-primary bg-primary/10 text-text-primary',
        check: 'text-primary',
      },
      secondary: {
        border: 'border-secondary bg-secondary/10 text-text-primary',
        check: 'text-secondary',
      },
      warning: {
        border: 'border-warning bg-warning/10 text-text-primary',
        check: 'text-warning',
      },
    };
  
    return (
      <div className={`grid gap-3 ${columnsClassName}`}>
        {options.map((option) => {
          const isString = typeof option === 'string';
          const id = isString ? option : option.id;
          const name = isString ? option : option.name;
          const desc = isString ? undefined : option.desc;
  
          const isSelected = Array.isArray(selectedValues)
            ? selectedValues.includes(id)
            : selectedValues === id;
  
          return (
            <button
              type="button"
              key={id}
              onClick={() => onSelect(id)}
              className={`p-4 rounded-xl border text-left transition-all flex ${
                desc ? 'flex-col justify-between h-28' : 'justify-between items-center'
              } ${
                isSelected
                  ? themeStyles[accentColor].border
                  : 'border-border bg-void text-text-secondary hover:border-border/80'
              }`}
            >
              <div className={desc ? 'w-full flex justify-between items-center mb-1' : 'flex items-center'}>
                <span className={`font-medium ${desc ? 'font-bold text-sm' : 'font-mono text-base'}`}>{name}</span>
                {isSelected && desc && <CheckCircle2 className={`w-4 h-4 ${themeStyles[accentColor].check}`} />}
              </div>
              
              {desc && <span className="text-xs text-text-secondary leading-snug">{desc}</span>}
              {isSelected && !desc && <CheckCircle2 className={`w-4 h-4 ${themeStyles[accentColor].check}`} />}
            </button>
          );
        })}
      </div>
    );
  }
