import { ContainerLayoutType } from "@/types/pocketbase-types";

/**
 * Clean serialized module representation inside a template
 */
export interface TemplateModuleItem {
  order: number;
  moduleType: string;
  showH3: boolean;
  h3Title?: Record<string, string>;
  config?: Record<string, unknown>;
  linkGroupId?: string;
}

/**
 * Clean serialized column representation inside a template
 */
export interface TemplateColumnItem {
  order: number;
  modules: TemplateModuleItem[];
}

/**
 * Clean serialized container representation inside a template
 */
export interface TemplateContainerItem {
  order: number;
  layoutType: ContainerLayoutType;
  showH2: boolean;
  h2Title?: Record<string, string>;
  columns: TemplateColumnItem[];
}

/**
 * JSON structure stored in `pageTemplates.structure`
 */
export interface PageTemplateStructure {
  containers: TemplateContainerItem[];
}

/**
 * Resolved PageTemplate entity
 */
export interface PageTemplateItem {
  id: string;
  user?: string;
  isSystem: boolean;
  name: Record<string, string>;
  description?: Record<string, string>;
  category?: string;
  structure: PageTemplateStructure;
  created?: string;
  updated?: string;
}
