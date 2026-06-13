import { prisma } from '@/lib/db/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

export default async function KnowledgeBasePage() {
  const chunks = await prisma.oai.findMany({
    orderBy: { id: 'asc' },
  });

  const totalChunks = await prisma.oai.count();

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Knowledge Base (RAG)</h1>
          <p className="text-muted-foreground mt-2">
            Menampilkan data chunks (potongan dokumen) yang digunakan chatbot untuk menjawab pertanyaan RAG.
          </p>
        </div>
        <Badge variant="secondary" className="text-lg py-1 px-4">
          Total: {totalChunks} Chunks
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {chunks.map((item) => {
          let meta: any = {};
          try {
            meta = typeof item.metadata === 'string' ? JSON.parse(item.metadata) : (item.metadata || {});
          } catch (e) { }

          return (
            <Card key={item.id.toString()} className="flex flex-col h-[400px]">
              <CardHeader className="pb-3 border-b bg-muted/20">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-sm font-semibold truncate pr-4" title={meta.criticalPoint || 'General'}>
                    {meta.criticalPoint || 'General KMS'}
                  </CardTitle>
                  <Badge variant="outline" className="text-xs whitespace-nowrap">
                    ID: {item.id.toString()}
                  </Badge>
                </div>
                <CardDescription className="text-xs flex flex-col gap-1 mt-2">
                  <span>Size: {item.chunk?.length || 0} chars</span>
                  {meta.page && <span>Page: {meta.page}</span>}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 p-0 overflow-hidden">
                <ScrollArea className="h-full w-full p-4 text-sm leading-relaxed text-muted-foreground">
                  {item.chunk}
                </ScrollArea>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {chunks.length === 0 && (
        <div className="text-center py-20 text-muted-foreground border border-dashed rounded-lg">
          Belum ada data knowledge base (RAG) di database.
        </div>
      )}
    </div>
  );
}
