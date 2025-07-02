import Header from '@/components/Header';

export const metadata = {
  title: 'Home',
  description: 'Welcome to Tour Network!',
};

export default function HomePage() {
  return (
    <div>
      <Header />
      <main className="p-6">
        <h1 className="text-3xl font-bold">Welcome to Tour Network</h1>
        <p className="mt-4">Book curated tour packages with ease.</p>
      </main>
    </div>
  );
}
