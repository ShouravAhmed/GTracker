export interface Problem {
  id?: number
  url: string
  name: string
  difficulty?: string
  day?: number
  type?: string
}

export interface GamamData {
  Coding: Problem[]
  SystemDesign: Problem[]
  ObjectOrientedDesign: Problem[]
  SchemaDesign: Problem[]
  APIDesign: Problem[]
  Behavioral: Problem[]
}

export type CategoryName = 
  | 'Coding'
  | 'SystemDesign'
  | 'ObjectOrientedDesign'
  | 'SchemaDesign'
  | 'APIDesign'
  | 'Behavioral'

