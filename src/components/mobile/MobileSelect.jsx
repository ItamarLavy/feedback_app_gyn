import React, { useState, useRef } from 'react';
import { useMediaQuery } from '@/hooks/use-mobile';
import { ChevronDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';

/**
 * MobileSelect: Renders as a bottom sheet (drawer) on mobile (<768px), standard select on desktop
 */
export default function MobileSelect({
  value,
  onValueChange,
  placeholder = 'Select option',
  children,
  label,
  triggerClassName,
}) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value);

  // Extract SelectItem children to use in drawer
  const options = React.Children.toArray(children).filter(
    (child) => child?.type?.name === 'SelectItem'
  );

  if (isMobile) {
    const selectedLabel =
      options.find((opt) => opt.props.value === selectedValue)?.props.children ||
      placeholder;

    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          className={
            triggerClassName ||
            'flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm hover:bg-accent'
          }
        >
          <span>{selectedLabel}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </button>

        <Drawer open={isOpen} onOpenChange={setIsOpen}>
          <DrawerContent>
            <div className="max-h-96 overflow-y-auto px-4 py-4">
              {label && <p className="text-sm font-medium mb-3">{label}</p>}
              <div className="space-y-2">
                {options.map((option) => (
                  <Button
                    key={option.props.value}
                    variant={
                      selectedValue === option.props.value
                        ? 'default'
                        : 'outline'
                    }
                    className="w-full justify-start"
                    onClick={() => {
                      setSelectedValue(option.props.value);
                      onValueChange(option.props.value);
                      setIsOpen(false);
                    }}
                  >
                    {option.props.children}
                  </Button>
                ))}
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  // Desktop: use standard Select
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={triggerClassName}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>{children}</SelectContent>
    </Select>
  );
}