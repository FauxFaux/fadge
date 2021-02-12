import { render } from 'preact';

const App = (
  <>
    <h1>Hello</h1>
    <svg width={1000} height={1000}>
      <rect y="10" x="120" width="100" height="100" rx="15" />
    </svg>
  </>
);

render(App, document.body);
