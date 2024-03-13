import { join } from "path"

export const getFullPath = (relativePath: string): string => join(process.cwd(), relativePath)

export const stringToArray = (value = ""): string[] => value ? value.split(',') : []
