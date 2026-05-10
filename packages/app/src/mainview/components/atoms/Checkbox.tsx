import { Checkbox as BaseCheckbox } from '@ai-brain/ui/components/checkbox';

export interface CheckboxProps {
  id?: string;
  checked?: boolean | 'indeterminate';
  onCheckedChange?: (checked: boolean | 'indeterminate') => void;
  className?: string;
  disabled?: boolean;
}

/**
 * Checkbox component with project-specific styling.
 * Uses 20px size with 8px rounded corners (per DESIGN.md).
 * Check icon is 12px for proper fit.
 */
export function Checkbox({ id, checked, onCheckedChange, className, disabled }: CheckboxProps) {
  return (
    <BaseCheckbox
      id={id}
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      className={`h-5 w-5 rounded-md data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground [&>span]:grid [&>span]:place-items-center [&_svg]:h-3 [&_svg]:w-3 ${className || ''}`}
    />
  );
}
