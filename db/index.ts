export type SecureDbEntry =  {
    clientSecret: string;
    allowedOrigins: string[];
}

export const SECURE_DB_DATA: { [key: string]: SecureDbEntry } = {
    '4fa7fa681e31c2bf513bb838a691d533d219fc53957e75d1ff422fcfe6dcb057': {
        clientSecret: 'ab5bd52e844eb1ec74f422cb494b449a38524c30e5ab00d6156d76a91094348e',
        allowedOrigins: ["http://localhost:5173", "http://localhost:5174"]
    }
}