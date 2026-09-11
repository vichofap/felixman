'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Bike, Boxes, CircleDollarSign, Headphones, Keyboard, MessageCircle, Mic, PackagePlus, RotateCcw, Search, ShoppingCart, Square, TriangleAlert, Volume2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

type Product = { id: number; name: string; sku: string; category: string; brand: string; compatibility: string; stock: number; minStock: number; cost: number; price: number };
type CartLine = Product & { quantity: number };
type VoiceRecognition = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: { 0: { 0: { transcript: string } } }[] }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};
type VoiceRecognitionConstructor = new () => VoiceRecognition;

declare global {
  interface Window {
    SpeechRecognition?: VoiceRecognitionConstructor;
    webkitSpeechRecognition?: VoiceRecognitionConstructor;
  }
}

const seedProducts: Product[] = [
  { id: 1, name: 'Aceite 20W-50 4T', sku: 'ACE-2050', category: 'Aceites', brand: 'Motul', compatibility: 'Motos 4 tiempos', stock: 18, minStock: 6, cost: 24, price: 32 },
  { id: 2, name: 'Pastillas de freno', sku: 'FRE-CGL', category: 'Frenos', brand: 'Kenda', compatibility: 'CG 125 / CG 150', stock: 4, minStock: 5, cost: 13, price: 22 },
  { id: 3, name: 'Cadena reforzada 428H', sku: 'TRA-428H', category: 'Transmisión', brand: 'Riffel', compatibility: '125cc–200cc', stock: 9, minStock: 4, cost: 38, price: 55 },
  { id: 4, name: 'Cámara de bicicleta 26', sku: 'BIC-C26', category: 'Bicicletas', brand: 'Chaoyang', compatibility: 'Aro 26', stock: 15, minStock: 5, cost: 8, price: 14 },
];

export default function Home() {
  const [products, setProducts] = useState<Product[]>(seedProducts);
  const [query, setQuery] = useState('');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [voiceQuestion, setVoiceQuestion] = useState('');
  const [voiceAnswer, setVoiceAnswer] = useState('Pulsa el botón Hablar y pregunta por un producto.');
  const [recognition, setRecognition] = useState<VoiceRecognition | null>(null);

  useEffect(() => {
    fetch('/api/products').then((r) => r.ok ? r.json() : Promise.reject()).then((data) => data.length && setProducts(data)).catch(() => undefined);
  }, []);

  useEffect(() => {
    setVoiceSupported(Boolean(window.SpeechRecognition || window.webkitSpeechRecognition));
    return () => window.speechSynthesis?.cancel();
  }, []);

  const filtered = products.filter((product) => `${product.name} ${product.sku} ${product.brand} ${product.compatibility}`.toLowerCase().includes(query.toLowerCase()));
  const investment = products.reduce((sum, product) => sum + product.cost * product.stock, 0);
  const potential = products.reduce((sum, product) => sum + product.price * product.stock, 0);
  const lowStock = products.filter((product) => product.stock <= product.minStock);
  const cartTotal = useMemo(() => cart.reduce((sum, line) => sum + line.price * line.quantity, 0), [cart]);

  function addToCart(product: Product) {
    setCart((current) => {
      const existing = current.find((line) => line.id === product.id);
      if (existing) return current.map((line) => line.id === product.id ? { ...line, quantity: Math.min(line.quantity + 1, line.stock) } : line);
      return [...current, { ...product, quantity: 1 }];
    });
    setNotice(`${product.name} agregado al pedido`);
    window.setTimeout(() => setNotice(''), 1800);
  }

  async function addProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const draft = {
      name: String(form.get('name')), sku: String(form.get('sku')), category: String(form.get('category')),
      brand: String(form.get('brand')), compatibility: String(form.get('compatibility')), stock: Number(form.get('stock')),
      minStock: Number(form.get('minStock')), cost: Number(form.get('cost')), price: Number(form.get('price')),
    };
    const response = await fetch('/api/products', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(draft) });
    const created = response.ok ? await response.json() : { ...draft, id: Date.now() };
    setProducts((current) => [created, ...current]);
    setDialogOpen(false);
    setNotice('Producto guardado correctamente');
  }

  function sendWhatsApp() {
    const lines = cart.map((line) => `• ${line.quantity} × ${line.name} — S/ ${(line.price * line.quantity).toFixed(2)}`);
    const message = `Hola, deseo hacer este pedido:\n\n${lines.join('\n')}\n\nTotal: S/ ${cartTotal.toFixed(2)}\nEntrega en: Casa Grande`;
    const storeNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, '') ?? '';
    window.open(`https://wa.me/${storeNumber}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  }

  function speak(message: string) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = 'es-PE';
    utterance.rate = 0.92;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }

  function answerQuestion(question: string) {
    const cleanQuestion = normalizeText(question);
    let answer = '';

    if (!cleanQuestion) {
      answer = 'No escuché una pregunta. Inténtalo nuevamente.';
    } else if (/agot|reponer|poco stock|stock bajo/.test(cleanQuestion)) {
      answer = lowStock.length
        ? `Hay ${lowStock.length} productos por reponer: ${lowStock.map((product) => `${product.name}, quedan ${product.stock}`).join('; ')}.`
        : 'No hay productos por reponer. Todo el inventario está abastecido.';
    } else {
      const product = findBestProduct(cleanQuestion, products);
      if (!product) {
        answer = `No encontré un producto que coincida con ${question}. Prueba diciendo el nombre, la marca o el código.`;
      } else if (/compat|sirve|funciona|modelo|moto/.test(cleanQuestion)) {
        answer = `${product.name}, marca ${product.brand}, es compatible con ${product.compatibility}. Quedan ${product.stock} unidades y cuesta ${formatSoles(product.price)}.`;
      } else if (/precio|cuesta|vale|cuanto esta|costo/.test(cleanQuestion)) {
        answer = `${product.name} cuesta ${formatSoles(product.price)}. Quedan ${product.stock} unidades.`;
      } else if (/stock|queda|hay|cantidad|existencia/.test(cleanQuestion)) {
        answer = `Quedan ${product.stock} unidades de ${product.name}. Su precio es ${formatSoles(product.price)}.`;
      } else {
        answer = `${product.name}, marca ${product.brand}. Cuesta ${formatSoles(product.price)}, quedan ${product.stock} unidades y es compatible con ${product.compatibility}.`;
      }
    }

    setVoiceQuestion(question);
    setVoiceAnswer(answer);
    speak(answer);
  }

  function startListening() {
    if (listening && recognition) {
      recognition.stop();
      return;
    }
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setVoiceSupported(false);
      const message = 'Este navegador no permite escuchar la voz. Puedes escribir la pregunta en el campo de texto.';
      setVoiceAnswer(message);
      speak(message);
      return;
    }

    window.speechSynthesis?.cancel();
    const listener = new Recognition();
    listener.lang = 'es-PE';
    listener.interimResults = false;
    listener.maxAlternatives = 1;
    listener.onresult = (event) => answerQuestion(event.results[0][0].transcript);
    listener.onerror = (event) => {
      const message = event.error === 'not-allowed'
        ? 'No pude usar el micrófono. Permite el acceso al micrófono o escribe la pregunta.'
        : 'No logré entenderte. Pulsa Hablar e inténtalo otra vez.';
      setVoiceAnswer(message);
      speak(message);
      setListening(false);
    };
    listener.onend = () => setListening(false);
    setRecognition(listener);
    setListening(true);
    setVoiceAnswer('Te escucho. Haz tu pregunta ahora.');
    listener.start();
  }

  useEffect(() => {
    const modelContext = (document as Document & { modelContext?: { registerTool: (tool: object, options?: { signal?: AbortSignal }) => void | Promise<void> } }).modelContext;
    if (!modelContext?.registerTool) return;
    const lifecycle = new AbortController();
    void Promise.resolve(modelContext.registerTool({
      name: 'search_inventory',
      title: 'Buscar en el inventario',
      description: 'Busca repuestos, aceites o productos por nombre, código, marca o compatibilidad.',
      inputSchema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'], additionalProperties: false },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute: (input: unknown) => {
        const term = typeof input === 'object' && input && 'query' in input ? String((input as { query: unknown }).query) : '';
        if (!term.trim()) throw new Error('La búsqueda no puede estar vacía.');
        setQuery(term);
        const matches = products.filter((product) => `${product.name} ${product.sku} ${product.brand} ${product.compatibility}`.toLowerCase().includes(term.toLowerCase()));
        return { count: matches.length, products: matches.slice(0, 10).map(({ id, name, sku, stock, price }) => ({ id, name, sku, stock, price })) };
      },
    }, { signal: lifecycle.signal })).catch(() => undefined);
    return () => lifecycle.abort();
  }, [products]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-[#111820] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-primary"><Bike size={23} /></span><div><p className="font-heading text-lg font-extrabold tracking-tight">MotoStock</p><p className="text-xs text-slate-400">Roma · Casa Grande</p></div></div>
          <Badge className="border-0 bg-emerald-500/15 text-emerald-300">Tienda operativa</Badge>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <Tabs defaultValue="voice">
          <TabsList className="mb-6 h-auto w-full justify-start overflow-x-auto rounded-xl bg-muted p-1 sm:w-auto">
            <TabsTrigger value="voice"><Mic /> Consulta por voz</TabsTrigger>
            <TabsTrigger value="inventory"><Boxes /> Inventario</TabsTrigger>
            <TabsTrigger value="catalog"><ShoppingCart /> Catálogo y pedido</TabsTrigger>
          </TabsList>

          <TabsContent value="voice">
            <section className="mx-auto max-w-4xl overflow-hidden rounded-3xl border-2 border-slate-700 bg-[#111820] text-white shadow-2xl">
              <div className="border-b border-white/10 px-5 py-5 sm:px-8">
                <div className="flex items-center gap-3">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary text-[#111820]"><Headphones size={28} aria-hidden="true" /></span>
                  <div><h1 className="font-heading text-2xl font-black sm:text-3xl">Asistente de inventario</h1><p className="mt-1 text-base text-slate-300">Consulta precios, existencias y compatibilidad.</p></div>
                </div>
              </div>

              <div className="grid gap-6 p-5 sm:p-8 lg:grid-cols-[280px_1fr]">
                <div className="flex flex-col items-center justify-center rounded-2xl bg-white/5 p-5 text-center">
                  <Button
                    type="button"
                    onClick={startListening}
                    aria-label={listening ? 'Detener escucha' : 'Hablar con el asistente'}
                    aria-pressed={listening}
                    className={`h-44 w-44 rounded-full border-8 text-xl font-black shadow-[0_0_0_8px_rgb(255_255_255/8%)] transition-transform focus-visible:ring-4 focus-visible:ring-white ${listening ? 'animate-pulse border-red-300 bg-red-500 text-white hover:bg-red-600' : 'border-orange-200 bg-primary text-[#111820] hover:scale-105 hover:bg-primary'}`}
                  >
                    <span className="flex flex-col items-center gap-2">{listening ? <Square size={45} fill="currentColor" /> : <Mic size={52} />}<span>{listening ? 'Detener' : 'Hablar'}</span></span>
                  </Button>
                  <p className="mt-5 text-base font-semibold" aria-live="polite">{listening ? 'Escuchando…' : voiceSupported ? 'Pulsa una vez y pregunta' : 'Usa la consulta escrita'}</p>
                </div>

                <div className="flex min-h-80 flex-col">
                  <div className="flex-1 rounded-2xl border border-white/15 bg-black/20 p-5 sm:p-6">
                    <p className="mb-3 text-sm font-bold uppercase tracking-widest text-orange-300">Respuesta</p>
                    <output aria-live="assertive" aria-atomic="true" className="block text-xl font-semibold leading-relaxed sm:text-2xl">{voiceAnswer}</output>
                    {voiceQuestion && <p className="mt-5 border-t border-white/10 pt-4 text-base text-slate-300"><span className="font-bold text-white">Pregunta:</span> {voiceQuestion}</p>}
                  </div>
                  <Button type="button" onClick={() => speak(voiceAnswer)} variant="outline" className="mt-4 h-14 border-white/30 bg-transparent text-base font-bold text-white hover:bg-white/10 hover:text-white"><Volume2 size={22} /> Repetir respuesta</Button>
                </div>
              </div>

              <form onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); answerQuestion(String(form.get('voiceText') ?? '')); }} className="border-t border-white/10 bg-white/5 p-5 sm:p-8">
                <Label htmlFor="voiceText" className="mb-3 flex items-center gap-2 text-base font-bold text-white"><Keyboard size={21} /> También puedes escribir la pregunta</Label>
                <div className="flex flex-col gap-3 sm:flex-row"><Input id="voiceText" name="voiceText" placeholder="Ejemplo: ¿Cuánto cuesta el aceite Motul?" className="h-14 flex-1 border-white/20 bg-white text-base text-slate-950 placeholder:text-slate-500" /><Button type="submit" className="h-14 px-7 text-base font-black">Consultar</Button></div>
                <div className="mt-5 grid gap-2 text-base text-slate-300 sm:grid-cols-3"><p>“¿Cuánto cuesta el aceite?”</p><p>“¿Cuántas cadenas quedan?”</p><p>“¿Qué productos debo reponer?”</p></div>
              </form>
            </section>
          </TabsContent>

          <TabsContent value="inventory">
            <section className="mb-6 grid gap-4 sm:grid-cols-3">
              <Stat icon={<Boxes />} label="Unidades en stock" value={String(products.reduce((sum, p) => sum + p.stock, 0))} detail={`${products.length} productos registrados`} />
              <Stat icon={<CircleDollarSign />} label="Valor de venta" value={`S/ ${potential.toFixed(2)}`} detail={`Inversión: S/ ${investment.toFixed(2)}`} />
              <Stat icon={<TriangleAlert />} label="Stock por reponer" value={String(lowStock.length)} detail={lowStock.length ? 'Requieren atención' : 'Todo abastecido'} warning={lowStock.length > 0} />
            </section>

            <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
              <div className="flex flex-col gap-4 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
                <div><h1 className="text-2xl font-extrabold tracking-tight">Inventario</h1><p className="text-sm text-muted-foreground">Precios, compatibilidad y existencias en un solo lugar.</p></div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger render={<Button className="bg-primary font-bold text-primary-foreground"><PackagePlus /> Nuevo producto</Button>} />
                  <DialogContent className="max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>Registrar producto</DialogTitle><DialogDescription>Agrega la información necesaria para vender y controlar el stock.</DialogDescription></DialogHeader>
                    <form onSubmit={addProduct} className="grid gap-4 sm:grid-cols-2">
                      <Field label="Producto" name="name" placeholder="Aceite 20W-50" required />
                      <Field label="Código / SKU" name="sku" placeholder="ACE-2050" required />
                      <Field label="Categoría" name="category" placeholder="Aceites" required />
                      <Field label="Marca" name="brand" placeholder="Motul" required />
                      <div className="sm:col-span-2"><Field label="Compatible con" name="compatibility" placeholder="Motos 4 tiempos" required /></div>
                      <Field label="Stock inicial" name="stock" type="number" placeholder="10" required />
                      <Field label="Alerta mínima" name="minStock" type="number" placeholder="3" required />
                      <Field label="Costo (S/)" name="cost" type="number" step="0.01" placeholder="20.00" required />
                      <Field label="Precio (S/)" name="price" type="number" step="0.01" placeholder="30.00" required />
                      <Button type="submit" className="sm:col-span-2">Guardar producto</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
              <SearchBox value={query} onChange={setQuery} />
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-5 py-3">Producto</th><th className="px-5 py-3">Categoría</th><th className="px-5 py-3">Compatibilidad</th><th className="px-5 py-3">Stock</th><th className="px-5 py-3 text-right">Precio</th><th className="px-5 py-3 text-right">Margen</th></tr></thead>
                  <tbody>{filtered.map((p) => <tr key={p.id} className="border-t hover:bg-muted/30"><td className="px-5 py-4"><p className="font-bold">{p.name}</p><p className="text-xs text-muted-foreground">{p.brand} · {p.sku}</p></td><td className="px-5 py-4">{p.category}</td><td className="px-5 py-4">{p.compatibility}</td><td className="px-5 py-4"><Badge variant={p.stock <= p.minStock ? 'destructive' : 'secondary'}>{p.stock} unid.</Badge></td><td className="px-5 py-4 text-right font-bold">S/ {p.price.toFixed(2)}</td><td className="px-5 py-4 text-right text-emerald-700">S/ {(p.price - p.cost).toFixed(2)}</td></tr>)}</tbody>
                </table>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="catalog">
            <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
              <section><div className="mb-5"><h1 className="text-3xl font-black tracking-tight">Catálogo para tus clientes</h1><p className="mt-1 text-muted-foreground">Busca un repuesto y arma el pedido para enviarlo por WhatsApp.</p></div><SearchBox value={query} onChange={setQuery} /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{filtered.map((p) => <article key={p.id} className="rounded-2xl border bg-card p-5 shadow-sm"><div className="mb-5 flex items-start justify-between"><span className="grid h-11 w-11 place-items-center rounded-xl bg-secondary text-primary"><Bike /></span><Badge variant="secondary">{p.stock} disponibles</Badge></div><p className="text-xs font-bold uppercase tracking-wide text-primary">{p.category}</p><h2 className="mt-1 text-lg font-extrabold">{p.name}</h2><p className="mt-1 min-h-10 text-sm text-muted-foreground">{p.brand} · {p.compatibility}</p><div className="mt-5 flex items-center justify-between"><span className="text-xl font-black">S/ {p.price.toFixed(2)}</span><Button onClick={() => addToCart(p)} size="sm"><ShoppingCart /> Agregar</Button></div></article>)}</div></section>
              <aside className="h-fit rounded-2xl border bg-[#111820] p-5 text-white shadow-xl lg:sticky lg:top-6"><div className="flex items-center gap-2"><MessageCircle className="text-[#25D366]" /><h2 className="text-xl font-extrabold">Pedido por WhatsApp</h2></div>{cart.length === 0 ? <p className="py-10 text-center text-sm text-slate-400">Agrega productos para preparar el mensaje del cliente.</p> : <div className="mt-5 space-y-3">{cart.map((line) => <div key={line.id} className="flex justify-between gap-4 border-b border-white/10 pb-3"><div><p className="font-semibold">{line.name}</p><p className="text-xs text-slate-400">{line.quantity} × S/ {line.price.toFixed(2)}</p></div><span className="font-bold">S/ {(line.quantity * line.price).toFixed(2)}</span></div>)}<div className="flex justify-between pt-2 text-lg font-black"><span>Total</span><span>S/ {cartTotal.toFixed(2)}</span></div><Button onClick={sendWhatsApp} className="mt-3 w-full bg-[#25D366] font-extrabold text-[#062d16] hover:bg-[#20bd5a]"><MessageCircle /> Enviar pedido</Button><Button onClick={() => setCart([])} variant="ghost" className="w-full text-slate-300 hover:bg-white/10 hover:text-white">Vaciar pedido</Button></div>}</aside>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      {notice && <output className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full bg-foreground px-5 py-3 text-sm font-bold text-background shadow-xl">{notice}</output>}
    </main>
  );
}

function Stat({ icon, label, value, detail, warning = false }: { icon: React.ReactNode; label: string; value: string; detail: string; warning?: boolean }) {
  return <article className="flex items-center gap-4 rounded-2xl border bg-card p-5 shadow-sm"><span className={`grid h-11 w-11 place-items-center rounded-xl ${warning ? 'bg-red-100 text-red-700' : 'bg-secondary text-primary'}`}>{icon}</span><div><p className="text-sm font-semibold text-muted-foreground">{label}</p><p className="text-2xl font-black tracking-tight">{value}</p><p className="text-xs text-muted-foreground">{detail}</p></div></article>;
}

function SearchBox({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <div className="relative m-5"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={19} /><Input aria-label="Buscar productos" value={value} onChange={(e) => onChange(e.target.value)} placeholder="Buscar por producto, código, marca o moto…" className="h-12 rounded-xl bg-card pl-11" /></div>;
}

function Field({ label, name, ...props }: React.ComponentProps<typeof Input> & { label: string; name: string }) {
  return <div className="grid gap-2"><Label htmlFor={name}>{label}</Label><Input id={name} name={name} {...props} /></div>;
}

function normalizeText(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function findBestProduct(question: string, products: Product[]) {
  const ignored = new Set(['cuanto', 'cuesta', 'precio', 'vale', 'queda', 'quedan', 'stock', 'hay', 'del', 'de', 'la', 'el', 'los', 'las', 'un', 'una', 'para', 'producto', 'repuesto', 'moto', 'bicicleta']);
  const terms = question.split(' ').filter((term) => term.length > 1 && !ignored.has(term));
  if (!terms.length) return null;

  const ranked = products.map((product) => {
    const name = normalizeText(product.name);
    const searchable = normalizeText(`${product.name} ${product.sku} ${product.brand} ${product.category} ${product.compatibility}`);
    const score = terms.reduce((total, term) => total + (name.includes(term) ? 3 : searchable.includes(term) ? 1 : 0), 0);
    return { product, score };
  }).sort((a, b) => b.score - a.score);

  return ranked[0]?.score > 0 ? ranked[0].product : null;
}

function formatSoles(value: number) {
  const whole = Number.isInteger(value) ? value.toFixed(0) : value.toFixed(2);
  return `${whole} soles`;
}
