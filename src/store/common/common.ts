import { create } from "zustand";
import { persist } from "zustand/middleware"

export type commonType = {
    settingsData : any[],
    leftNavLogo:string,
    leftNavcode:string,
    autologoutUrl:string,
    logoutUrl: string,
    footerName: string,
    templateId: string, 
    leftNavCollapseLogo:string,
    footerVisible:boolean,
    setSettingsData : (value : any) => void, 
    setleftNavLogo : (value : any) => void,
    setleftNavcode : (value : any) => void,
    setautoLogoutUrl: (value: string) => void,
    setLogoutUrl: (value: string) => void,
    setfooterName: (value: any) => void,
    setTemplateId: (value: string) => void, 
    setleftNavCollapseLogo: (value : any) => void,
    setfooterVisible: (value : any) => void,
}

export const commonStore = create<commonType>()(
    persist(

        (set, get) => ({
            settingsData : [],
            leftNavLogo:'',
            leftNavcode:'',
            autologoutUrl: "",
            logoutUrl:"",
            footerName:"" ,
            templateId: "",
            leftNavCollapseLogo: "",
            footerVisible:false,
            setleftNavLogo : (value : any) => set((state : any) => ({leftNavLogo : value})),
            setleftNavcode : (value : any) => set((state : any) => ({leftNavcode : value})),
            setSettingsData : (value : any) => set((state : any) => ({settingsData : value})),
            setautoLogoutUrl : (value) => set(() => ({ autologoutUrl: value })),
            setLogoutUrl : (value) => set(() => ({ logoutUrl: value })),
            setfooterName : (value : any) => set((state : any) => ({footerName : value})),
            setTemplateId: (value: string) => set(() => ({ templateId: value })),
            setleftNavCollapseLogo: (value : any) => set((state : any) => ({leftNavCollapseLogo : value})),
            setfooterVisible: (value : any) => set((state : any) => ({footerVisible : value})),
        }),
        {
            name : "commonStore"
        }
    )
)


