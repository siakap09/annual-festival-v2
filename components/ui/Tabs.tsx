import Link from "next/link";
import { cn } from "@/lib/utils";

export interface TabItem {
  key: string;
  label: string;
  icon?: string;
}

export function Tabs({
  tabs,
  activeKey,
  basePath,
  param = "tab",
}: {
  tabs: TabItem[];
  activeKey: string;
  basePath: string;
  param?: string;
}) {
  return (
    <div className="flex flex-wrap gap-5 border-b border-gray-200 px-4">
      {tabs.map((tab) => {
        const active = tab.key === activeKey;
        return (
          <Link
            key={tab.key}
            href={`${basePath}?${param}=${tab.key}`}
            className={cn(
              "flex items-center gap-1.5 border-b-2 py-3 text-sm font-medium whitespace-nowrap",
              active
                ? "border-orange-600 text-orange-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            {tab.icon && <span>{tab.icon}</span>}
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}

export function Pills({
  items,
  activeKey,
  basePath,
  param,
  extraParams,
}: {
  items: TabItem[];
  activeKey: string;
  basePath: string;
  param: string;
  extraParams?: Record<string, string>;
}) {
  const qs = new URLSearchParams(extraParams);
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        const active = item.key === activeKey;
        const params = new URLSearchParams(qs);
        params.set(param, item.key);
        return (
          <Link
            key={item.key}
            href={`${basePath}?${params.toString()}`}
            className={cn(
              "rounded-md px-4 py-1.5 text-sm font-semibold",
              active ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
