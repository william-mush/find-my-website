import { NextRequest, NextResponse } from 'next/server';
import { waybackAPI } from '@/lib/external-apis/wayback';
import { scriptGenerator, ScriptType } from '@/lib/recovery/script-generator';

export async function POST(request: NextRequest) {
  try {
    const { domain, scriptType } = await request.json();

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain is required' },
        { status: 400 }
      );
    }

    const type: ScriptType = scriptType || 'bash';

    // Get Wayback Machine info
    const recoveryInfo = await waybackAPI.getRecoveryInfo(domain);

    if (!recoveryInfo.bestSnapshot) {
      return NextResponse.json(
        { error: 'No snapshots found for this domain' },
        { status: 404 }
      );
    }

    // Generate script
    const scriptContent = scriptGenerator.generate(
      {
        domain,
        snapshotDate: recoveryInfo.bestSnapshot.timestamp,
        bestSnapshot: recoveryInfo.bestSnapshot,
        totalSnapshots: recoveryInfo.totalSnapshots,
        estimatedPages: recoveryInfo.estimatedPages,
        quality: recoveryInfo.quality,
        includeAssets: true,
        includeSubdomains: false,
      },
      type
    );

    const fileExtension = type === 'bash' ? 'sh' : type === 'python' ? 'py' : 'js';
    const fileName = `recover-${domain.replace(/\./g, '-')}.${fileExtension}`;

    return new NextResponse(scriptContent, {
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error: any) {
    console.error('Script generation failed:', error);
    return NextResponse.json(
      { error: 'Script generation failed', message: error.message },
      { status: 500 }
    );
  }
}
