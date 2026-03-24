import { cn } from '@/lib/utils'
import { SpinnerGap as SpinnerGapIcon } from "@phosphor-icons/react/dist/ssr/SpinnerGap"

function Spinner({ className, ...props }: React.ComponentProps<'svg'>) {
  return (
    <SpinnerGapIcon
      role="status"
      aria-label="Loading"
      className={cn('size-4 animate-spin', className)}
      {...props}
    />
  )
}

export { Spinner }
