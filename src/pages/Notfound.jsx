const Notfound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-gray-800">
      <div className="text-6xl font-bold mb-4">🚧</div>
      <h1 className="text-4xl font-bold mb-2">404 - Page Not Found</h1>
      <p className="text-xl mb-8 text-center px-4">
        Oops! It looks like the page you're looking for doesn't exist.
      </p>
      <a href="/" className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-300">
        Go Back Home
      </a>
    </div>
  );
};
export default Notfound;