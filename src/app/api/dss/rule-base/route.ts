import { NextResponse } from "next/server";
import { loadRuleBase } from "@/lib/dss/rule-engine";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const section = searchParams.get("section") || "overview";
  const cp = searchParams.get("cp") || "";

  try {
    const ruleBase = loadRuleBase();

    if (section === "overview") {
      return NextResponse.json({
        metadata: ruleBase.metadata,
        risk_scale: ruleBase.risk_scale,
        aggregation_rules: ruleBase.aggregation_rules,
        construct_summary: ruleBase.constructs.map(c => ({
          group_code: c.group_code,
          group_label: c.group_label,
          construct_code: c.construct_code,
          construct_name: c.construct_name,
          indicator_count: c.indicators.length,
          rule_count: c.construct_rules.length,
        })),
      });
    }

    if (section === "construct" && cp) {
      const constructs = ruleBase.constructs.filter(c => c.group_code === cp);
      if (constructs.length === 0) {
        return NextResponse.json({ error: `No constructs found for ${cp}` }, { status: 404 });
      }

      return NextResponse.json({
        group_code: cp,
        group_label: constructs[0].group_label,
        constructs: constructs.map(c => ({
          construct_code: c.construct_code,
          construct_name: c.construct_name,
          construct_rules: c.construct_rules,
          indicators: c.indicators.map(ind => ({
            indicator_no: ind.indicator_no,
            indicator_name: ind.indicator_name,
            supporting_evidence: ind.supporting_evidence,
            performance_rules: ind.performance_rules,
          })),
        })),
      });
    }

    if (section === "aggregation") {
      return NextResponse.json({
        aggregation_rules: ruleBase.aggregation_rules,
        risk_scale: ruleBase.risk_scale,
      });
    }

    return NextResponse.json({ error: "Invalid section parameter" }, { status: 400 });
  } catch (error: any) {
    console.error('Rule Base GET Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
