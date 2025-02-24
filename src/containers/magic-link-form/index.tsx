"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Terminal } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { useServerAction } from "zsa-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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

import { sendMagicLinkAction } from "./actions"
import { magicLinkFormSchema } from "./validation"

export function MagicLinkForm() {
  const form = useForm<z.infer<typeof magicLinkFormSchema>>({
    resolver: zodResolver(magicLinkFormSchema),
    defaultValues: {
      email: ""
    }
  })

  const { execute, isPending, error } = useServerAction(sendMagicLinkAction, {
    onError({ err }) {
      toast.error("Something went wrong", {
        description: err.message
      })
    },
    onSuccess() {
      const email = form.getValues("email")
      form.reset()
      // store email in localstorage
      toast.success("Email sent!", {
        description: `Your magic link has been sent to ${email}`
      })
    }
  })

  function onSubmit(values: z.infer<typeof magicLinkFormSchema>) {
    execute(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {error && (
          <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Uhoh, we couldn&apos;t send your magic link</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
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

        <div className="pt-2">
          <LoaderButton
            isLoading={isPending}
            className="w-full"
            type="submit"
            size="lg"
          >
            Send
          </LoaderButton>
        </div>
      </form>
    </Form>
  )
}
