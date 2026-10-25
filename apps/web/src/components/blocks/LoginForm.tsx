import { cn } from "cn";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/base/card";
import { Field, FieldGroup, FieldLabel } from "@/components/base/field";
import { Input } from "@/components/base/input";
import { Button } from "@/components/base/button";

export function LoginForm(props: {
  error?: string;
  container?: React.ComponentProps<"div">;
  form?: React.ComponentProps<"form">;
}) {
  const containerProps = props.container ?? {};
  const formProps = props.form ?? {};

  return (
    <div {...containerProps} className={cn("flex flex-col gap-6", containerProps.className)}>
      <Card>
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>Enter your email below to login to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form {...formProps}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input id="email" name="email" type="email" placeholder="m@example.com" required />
              </Field>
              <Field>
                <Input id="password" name="password" type="password" required />
              </Field>
              <Field>
                <Button type="submit">Login</Button>
              </Field>
              {props.error && (
                <p role="alert" className="text-sm text-destructive">
                  {props.error}
                </p>
              )}
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
