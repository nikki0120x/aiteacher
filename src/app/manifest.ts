/* src\app\manifest.ts */
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "AITeacher",
        short_name: "AITeacher",
        description: "勉強に浪漫と好奇心を。そして、智慧と伴に未だ見ぬ未来を切り拓け！",
        start_url: "/",
        display: "standalone",
        background_color: "#f2f2f2",
        theme_color: "#00bfff",
        icons: [
            {
                src: "/images/apps/png/App_AITeacher_small_transparent.png",
                sizes: "500x500",
                type: "image/png",
                purpose: "any",
            },
            {
                src: "/images/apps/png/App_AITeacher_large_transparent.png",
                sizes: "1000x1000",
                type: "image/png",
                purpose: "any",
            },
        ],
    };
}