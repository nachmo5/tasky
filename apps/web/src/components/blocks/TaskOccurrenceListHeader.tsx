import { Button } from "../base/button";
import { cn } from "cn";
import { objectEntries } from "@repo/lib";
import type { ReactNode } from "react";
import type { FiltersState } from "@/config/filters";
import { FILTERS } from "@/config/filters";
import { Link } from "react-router";
import { getRoute } from "@/config/routes";
import { CalendarIcon, SettingsIcon } from "lucide-react";

export function TaskOccurrenceListHeader(props: {
  filters: FiltersState;
  onFilterChange: (filterName: keyof FiltersState, filterValue: boolean) => void;
}) {
  const { filters, onFilterChange } = props;
  return (
    <div className="flex justify-between items-center">
      <div className="flex gap-2 items-center">
        <p className="text-xs text-secondary-foreground">Filter:</p>
        <div className="bg-secondary rounded-lg flex gap-1">
          {objectEntries(FILTERS).map(([filterName, filterDef]) => (
            <Button
              key={filterName}
              variant="ghost"
              size="icon-lg"
              className={cn(filters[filterName] && "bg-primary/50")}
              onClick={() => onFilterChange(filterName, !filters[filterName])}
            >
              <Barrable isBarred={filters[filterName]}>
                <filterDef.icon />
              </Barrable>
            </Button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 items-center">
        <div className="rounded-lg flex gap-6">
          <Link to={getRoute("/task-templates")}>
            <SettingsIcon />
          </Link>
          <Link to={getRoute("/calendar")}>
            <CalendarIcon />
          </Link>
        </div>
      </div>
    </div>
  );
}

function Barrable({ children, isBarred }: { children: ReactNode; isBarred: boolean }) {
  if (!isBarred) {
    return children;
  }
  return (
    <span className="relative inline-flex items-center justify-center after:content-[''] after:absolute after:w-full after:h-0.5 after:bg-current after:top-1/2 after:-translate-y-1/2 after:-rotate-45">
      {children}
    </span>
  );
}
