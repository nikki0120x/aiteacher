"use client";
import { redirect, useParams } from "next/navigation";

export default function ChatRedirect() {
	const params = useParams();
	const { language, location } = params;

	if (language && location) {
		redirect(`/${language}/${location}/chat`);
	}

	return null;
}
