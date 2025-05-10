type ClientData = {
    clientId: string,
    clientSecret: string
}

type EncrptedData = { 
    token: string; 
    iv: string 
}

type VerifyData = EncrptedData & Pick<ClientData, "clientSecret">

type Mode = "dev" | "production"

type HexConverter =  {
    (arr: Uint8Array): string;
}


export type {
    ClientData,
    EncrptedData,
    VerifyData,
    HexConverter,
    Mode
}