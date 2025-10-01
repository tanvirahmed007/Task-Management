import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// Define the variants using CVA
const componentVariants = cva(
  "base-styles", // Base styles that always apply
  {
    variants: {
      variant: {
        default: "default-variant-styles",
        secondary: "secondary-variant-styles",
        destructive: "destructive-variant-styles",
        outline: "outline-variant-styles",
        // Add your custom variants here
      },
      size: {
        default: "default-size-styles",
        sm: "small-size-styles",
        lg: "large-size-styles",
        // Add your custom sizes here
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)