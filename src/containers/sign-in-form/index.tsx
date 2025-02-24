"use client"

import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { Terminal } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { useServerAction } from "zsa-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { LoaderButton } from "@/components/loader-button"

import { signInAction } from "./actions"
import { signInFormSchema } from "./validation"

export function SignInForm() {
  const { execute, isPending, error } = useServerAction(signInAction, {
    onError({ err }) {
      toast.error("Something went wrong", { description: err.message })
    },
    onSuccess() {
      // store email in localstorage
      toast.success("Let's Go!", {
        description: "Enjoy your session"
      })
    }
  })

  const form = useForm<z.infer<typeof signInFormSchema>>({
    resolver: zodResolver(signInFormSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  })

  function onSubmit(values: z.infer<typeof signInFormSchema>) {
    execute(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {error && (
          <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Uhoh, we couldn&apos;t log you in</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email address</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  className="w-full"
                  placeholder="Enter your email address"
                  type="email"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  className="w-full"
                  placeholder="Enter your password"
                  type="password"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center justify-between pt-4">
          <LoaderButton
            isLoading={isPending}
            type="submit"
            size="lg"
            className="px-12"
          >
            Login
          </LoaderButton>
          <Link href="/forgot-password">
            <Button variant="link">Forgot password?</Button>
          </Link>
        </div>
      </form>
    </Form>
  )
}
