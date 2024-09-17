import {
  Body,
  Button,
  Html,
  Img,
  Tailwind,
  Heading,
  Section,
  Text,
  Container,
  Head,
  Hr,
  Link,
} from "@react-email/components";
import * as React from "react";

export default function Email({
  user_name,
  code,
}: {
  user_name: string;
  code: string;
}) {
  return (
    <Html>
      <Head />
      <Tailwind>
        <Body className="bg-white">
          <Container
            className="border border-gray-200 border-solid rounded shadow-md w-full font-sans font-medium "
            style={{ padding: "clamp(0.5rem,1rem,1.25rem)" }}
          >
            <Heading className="text-center">
              <Text className=" text-6xl font-sans font-bold text-violet-700">
                Chat Up
              </Text>
              <Text className="font-medium text-slate-600   ">
                Connect and Hangout with your friends and Communities
              </Text>
            </Heading>
            <Section className="text-slate-800">
              <Text>
                Hi <strong>USER</strong>
              </Text>
              <Text>
                Welcome to <strong>Chat Up !</strong> , Use the verification
                code below to proceed your sign up process:
              </Text>
            </Section>
            <Section className="my-[10dvh] text-center">
              <Text className="font-bold text-5xl text-violet-900 uppercase text-center space-x-10 tracking-[2rem]">
                verify
              </Text>
            </Section>
            <Hr className="w-full h-[1px] bg-gray-200" />
            <Section>
              <Text className="text-xs text-slate-500 text-justify">
                This email is was sent to you from{" "}
                <Link href="https://chatup.vercel.app/">
                  {"(https://chatup.vercel.app/)"}
                </Link>
                . if you did not expect an email from us reset your password and
                further secure your email address here{" "}
                <Link href="https://myaccount.google.com/u/1/security?hl=en">
                  {"(https://myaccount.google.com/u/1/security?hl=en)"}
                </Link>
                . And email us on <strong>chatup.dev@gmail.com</strong> so we
                can delete your information in our system.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
