import { Body, Html, Tailwind, Heading, Section, Text, Container, Head, Hr, Link } from "@react-email/components";
import * as React from "react";

export default function SignUpEmail({ username, code }: { username: string; code: string }) {
  return (
    <Html>
      <Head />
      <Tailwind>
        <Body className="bg-white">
          <Container
            className="border border-gray-200 border-solid rounded shadow-md w-full font-sans font-medium p-20"
            style={{ padding: "clamp(0.5rem,1rem,1.25rem)" }}
          >
            <Heading className="text-center">
              <Text className=" text-5xl font-sans font-bold text-violet-700">Chat Up</Text>
              <Text className="font-medium text-slate-600   ">
                Connect and Hangout with your friends and Communities
              </Text>
            </Heading>
            <Section className="text-slate-800">
              <Text>
                Hi <strong>{username}</strong>
              </Text>
              <Text>
                Welcome to <strong>Chat Up !</strong> , Use the verification code below to proceed your sign up process:
              </Text>
            </Section>
            <Section className="my-[8dvh] text-center">
              <Text className="font-bold text-5xl text-violet-900 uppercase text-center space-x-10 tracking-[2rem]">
                {code}
              </Text>
            </Section>
            <Hr className="w-full h-[1px] bg-gray-200" />
            <Section>
              <Text className="text-xs text-slate-500 text-justify">
                This email is was sent to you from{" "}
                <Link href="https://www.chat-up.xyz/">{"(https://www.chat-up.xyz/login)"}</Link>. if you did not expect
                an email from us reset your password, further secure your email address. If you don't remember using
                your email on our site, email us on <strong>chatup.dev.service@gmail.com</strong> so we can delete your
                information in our system.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
