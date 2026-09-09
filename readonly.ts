// readonly.ts

// 허용된 채널 목록
const VALID_CHANNELS = ["instagram", "x", "youtube", "threads"];

export const getValidChannel = (channel : string | null | undefined) : string | null => {
    if (!channel)
        return null;

    return VALID_CHANNELS.includes(channel) ? channel : null;
};

export const isValidChannel = (channel: string | null | undefined): boolean => {
    return getValidChannel(channel) !== null;
};

export const CHANNEL_UI : Record<string, { label: string; bgColor: string; textColor: string; borderColor: string; hoverBg: string; svgContent: string; svgFill: string; svgStroke: string; }> = {
    instagram: {
        label: "Instagram",
        bgColor: "bg-pink-50", textColor: "text-pink-600", borderColor: "border-pink-200", hoverBg: "hover:bg-pink-100",
        svgContent: '<rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>',
        svgFill: "none", svgStroke: "currentColor"
    },
    x: {
        label: "X (Twitter)",
        bgColor: "bg-gray-50", textColor: "text-gray-800", borderColor: "border-gray-300", hoverBg: "hover:bg-gray-200",
        svgContent: '<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 22.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>',
        svgFill: "currentColor", svgStroke: "none"
    },
    youtube: {
        label: "YouTube",
        bgColor: "bg-red-50", textColor: "text-red-600", borderColor: "border-red-200", hoverBg: "hover:bg-red-100",
        svgContent: '<path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"></path>',
        svgFill: "currentColor", svgStroke: "none"
    },
    threads: {
        label: "Threads",
        bgColor: "bg-slate-50", textColor: "text-slate-800", borderColor: "border-slate-300", hoverBg: "hover:bg-slate-100",
        svgContent: '<circle cx="12" cy="12" r="4"></circle><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"></path>',
        svgFill: "none", svgStroke: "currentColor"
    },
    unknown: {
        label: "Unknown",
        bgColor: "bg-gray-50", textColor: "text-gray-500", borderColor: "border-gray-300", hoverBg: "hover:bg-gray-100",
        svgContent: '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>',
        svgFill: "none", svgStroke: "currentColor"
    }
};