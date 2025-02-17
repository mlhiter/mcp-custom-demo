import { NextRequest, NextResponse } from "next/server";

import config from "@/constants/mcpConfig/config.json";

export async function POST(request: NextRequest) {
  try {
    const response = await request.json();

    const tool = config.server.find((t) => t.name === response.tool);

    if (!tool?.host) {
      throw new Error(`找不到工具 ${response.tool} 的 host 配置`);
    }

    const result = await fetch(tool.host, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(response.arguments),
    });

    return NextResponse.json(await result.json());
  } catch (error) {
    console.error("工具调用API出错:", error);
    return NextResponse.json({ error: "工具调用失败" }, { status: 500 });
  }
}
