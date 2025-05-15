// /Users/duke/Documents/GitHub/RentKub/client/src/components/admin/StateCard.jsx
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// --- Remove Link import if no longer needed elsewhere ---
// import { Link } from "react-router-dom"; // Use 'react-router-dom' for v6+
// --- End Removal ---
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

// Accept onClick and disabled props
const StateCard = ({
  label,
  value,
  icon: Icon,
  className,
  onClick,
  disabled = false,
}) => {
  return (
    <Card
      className={cn(
        "shadow-sm hover:shadow-md transition-shadow flex flex-col",
        className
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
      </CardHeader>
      <CardContent className="pb-4">
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>

      {/* Conditionally render footer based on onClick presence */}
      {onClick && (
        <CardFooter className="pt-0 mt-auto">
          {/* Change Button: remove asChild, add onClick handler, add disabled prop */}
          <Button
            onClick={onClick}
            size="sm"
            variant="outline"
            className="w-full"
            disabled={disabled} // Use the disabled prop
          >
            View Details
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};
export default StateCard;
