import path from "path"

export const getFullPath = (realtivePath: string): string => {
    return path.join(process.cwd(), realtivePath)
}

export const stringToArray = (value = ""): string[] => {
    return value ? value.split(',') : []
}