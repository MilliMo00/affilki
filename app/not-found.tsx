import { Flower } from "@/components/brand/Flower";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 text-center">
      <Flower size={72} filled={0} rays={false} className="text-petal" rayColor="var(--ink)" />
      <h1 className="text-3xl">Страница не найдена</h1>
      <p className="max-w-md text-lg text-text">Ссылка устарела или в адресе опечатка.</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button href="/">На главную</Button>
        <Button href="/awards" variant="secondary">
          К премии
        </Button>
      </div>
    </main>
  );
}
