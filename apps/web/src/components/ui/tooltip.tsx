import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '@/lib/utils';

const TooltipProvider = TooltipPrimitive.Provider;

const TooltipLabelContext = React.createContext<string | undefined>(undefined);

function textContent(node: React.ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (!React.isValidElement<{ children?: React.ReactNode }>(node)) {
    return Array.isArray(node) ? node.map(textContent).join(' ') : '';
  }
  return textContent(node.props.children);
}

function Tooltip({
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  const content = React.Children.toArray(children).find(
    (child) => React.isValidElement(child) && child.type === TooltipContent
  );
  const label = textContent(content).replace(/\s+/g, ' ').trim() || undefined;
  return (
    <TooltipLabelContext.Provider value={label}>
      <TooltipPrimitive.Root {...props}>{children}</TooltipPrimitive.Root>
    </TooltipLabelContext.Provider>
  );
}

// Tooltips describe controls, but Radix only mounts that description while open.
// Keep icon-only triggers named even when their tooltip is closed.
const TooltipTrigger = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Trigger>
>(({ children, ...props }, ref) => {
  const tooltipLabel = React.useContext(TooltipLabelContext);
  const childProps = React.isValidElement<React.HTMLAttributes<HTMLElement>>(
    children
  )
    ? children.props
    : undefined;
  const hasName =
    props['aria-label'] ||
    props['aria-labelledby'] ||
    childProps?.['aria-label'] ||
    childProps?.['aria-labelledby'] ||
    textContent(children).trim();
  const informationalIcon =
    props.asChild &&
    React.isValidElement(children) &&
    (children.type === 'span' || children.type === 'div') &&
    !childProps?.role &&
    !childProps?.onClick;
  return (
    <TooltipPrimitive.Trigger
      ref={ref}
      {...(!hasName && tooltipLabel
        ? {
            'aria-label': tooltipLabel,
            ...(informationalIcon ? { role: 'img', tabIndex: 0 } : {}),
          }
        : {})}
      {...props}
    >
      {children}
    </TooltipPrimitive.Trigger>
  );
});
TooltipTrigger.displayName = TooltipPrimitive.Trigger.displayName;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, collisionPadding = 8, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    collisionPadding={collisionPadding}
    className={cn(
      'pointer-events-none z-50 max-w-[300px] overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
      className
    )}
    {...props}
  />
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
