/* src\app\layout.tsx */
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "AITeacher",
        short_name: "AITeacher",
        description: "勉強に浪漫と好奇心を。そして、智慧と伴に未だ見ぬ未来を切り拓け！",
        start_url: "/",
        display: "standalone",
        background_color: "#0d0d0d",
        theme_color: "#00bfff",
        icons: [
            {
                src: "/images/icons/png/Icon_AITeacher_small_theme.png",
                sizes: "500x500",
                type: "image/png",
                purpose: "any",
            },
            {
                src: "/images/icons/png/Icon_AITeacher_large_theme.png",
                sizes: "1000x1000",
                type: "image/png",
                purpose: "any",
            },
        ],
    };
}