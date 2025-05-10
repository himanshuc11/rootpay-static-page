import { DebitCardCheckout } from "@/components/page-components/debit-card-checkout";
import { QUERY_PARAMS } from "@/constants";
import { SECURE_DB_DATA } from "@/db";
import { getIsValidOrigin, verifyToken } from "@/utils";
import { headers } from "next/headers";

type PageProps = {
  searchParams: Promise<{ [key: string]: string | undefined }>
}

export default async function Home(props: PageProps) {
  const { searchParams }  = props;

  const headersList = await headers()
  const params = await searchParams;

  const referer = headersList.get("referer")
  const refererUrl = referer ? new URL(referer) : null
  const origin = refererUrl?.origin
  
  if(!params) {
    return <h1>PARAMS NOT PASSED</h1>
  }

  const clientId = params[QUERY_PARAMS.CLIENT_ID];
  const sessionToken = params[QUERY_PARAMS.SESSION_TOKEN];
  const iv = params[QUERY_PARAMS.IV];

  if(!clientId || typeof clientId !== "string") {
    return <h1>CLIENT ID NOT PASSED</h1>
  }

  if(!sessionToken) {
    return <h1>SESSION TOKEN NOT PASSED</h1>
  }

  if(!iv) {
    return <h1>IV NOT PASSED</h1>
  }

  const clientData = SECURE_DB_DATA[clientId]
  
  if(!clientData) {
    return <h1>Invalid Credentials</h1>
  }

  const clientSecret = clientData.clientSecret;
  const isValidOrigin = getIsValidOrigin(clientId, origin)

  if(!clientSecret) {
    return <h1>Invalid secret</h1>
  }

  if(!isValidOrigin) {
    return <h1>Invalid Origin</h1>
  }

  const isValidToken = verifyToken({ clientSecret, token: sessionToken, iv });
  if(!isValidToken) {
    return <h1>Invalid combination of credentials</h1>
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24">
      <div className="w-full max-w-md">
        <h1 className="mb-6 text-2xl font-bold text-center">Debit Card Checkout</h1>
        <DebitCardCheckout />
      </div>
    </main>
  );
}
