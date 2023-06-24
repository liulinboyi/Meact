import React from './Meact'

export function App() {
  const [value, setValue] = React.useState("");

  const handleValueChange = (e) => {
    React.startTranstion(() => setValue(e.target.value));
    // setValue(e.target.value);
  };
  return (
    <div>
      <input onChange={handleValueChange} />
      {Array(1000)
        .fill("a")
        .map(() => (
          <div>{value}</div>
        ))}
    </div>
  );
}
