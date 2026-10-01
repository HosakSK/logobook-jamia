import {
  PagesResponse,
  ColumnsResponse,
  ContainerLayoutType,
  PageMenuStyle,
  BaseSystemFields,
  ContainersRecord,
  ModulesRecord,
} from "@/types/pocketbase-types";
import { BaseModuleConfig, I18nRecord } from "./module";

export interface PageItem extends PagesResponse {
  title: I18nRecord;
}

export interface PageHierarchyItem extends PageItem {
  children?: PageHierarchyItem[];
}

export interface ColumnWithModules extends ColumnsResponse {
  modules: Array<BaseSystemFields & ModulesRecord<I18nRecord, BaseModuleConfig>>;
}

export interface ContainerWithColumns extends BaseSystemFields, ContainersRecord<number[], I18nRecord> {
  columns: ColumnWithModules[];
}

export interface PageDetail extends PageItem {
  containers: ContainerWithColumns[];
}

export interface CreatePageInput {
  title: string | I18nRecord;
  slug: string;
  parentId?: string;
  isInMenu?: boolean;
  menuStyle?: PageMenuStyle;
}

export interface UpdatePageInput {
  title?: string | I18nRecord;
  slug?: string;
  parentId?: string | null;
  isInMenu?: boolean;
  menuStyle?: PageMenuStyle;
  order?: number;
}
