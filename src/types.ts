export type Platform = 'ios' | 'android';
 export interface ILTRSettings {
  artefactReleaseIdFor: IPlatformData
  devicefarmIdFor: IPlatformData
  releaseType: string
 }
 
 interface IPlatformData {
  ios: string
  android: string
 }