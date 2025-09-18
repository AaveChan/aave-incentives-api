import app from './app';

const PORT: number = 5050;

app.listen(PORT, (): void => {
  // eslint-disable-next-line no-console
  console.log(`Server is running on ${PORT}...`);
});
