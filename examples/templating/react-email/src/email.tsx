import { Button, Html, Text } from "react-email";

interface EmailProps {
  lang: string;
  url: string;
}

export const Email: React.FC<Readonly<EmailProps>> = (props) => {
  return (
    <Html lang={props.lang}>
      <Text>Hello from React Email</Text>
      <Button href={props.url}>Click me</Button>
    </Html>
  );
};
