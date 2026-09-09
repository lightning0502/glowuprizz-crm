// app/api/logout/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
    try {
        const cookieStore = cookies();
        (await cookieStore).delete("admin_session");

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Logout error : ", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}