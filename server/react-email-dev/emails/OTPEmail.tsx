import {
  Body,
  Button,
  Html,
  Img,
  Heading,
  Section,
  Text,
  Container,
  Head,
  Hr,
  Link,
  Tailwind,
} from "@react-email/components";
import * as React from "react";

export default function OTPEmail() {
  return (
    <Html>
      <Head />
      <Tailwind>
        <Body className="bg-white">
          <Container
            className="border border-gray-200 border-solid rounded shadow-md w-full font-sans font-medium "
            style={{ padding: "clamp(0.5rem,1rem,1.25rem)" }}
          >
            <Section className="mt-10">
              <Img
                src="https://utfs.io/f/d79485fc-99a5-4e40-8364-45e81d483345-vacupi.png"
                alt="croom"
                className="h-auto aspect-square w-[15vh] my-0 mx-auto"
              />
              <Text
                className="text-center font-sans font-medium"
                style={{ fontSize: "clamp(1rem,1.75rem,2.25rem)" }}
              >
                Welcome to{" "}
                <span className="italic text-center text-blue-500 font-medium">
                  Croom
                </span>
              </Text>
            </Section>
            <Section className="my-10 text-gray-800">
              <Text
                style={{
                  fontSize: "clamp(1rem, 1.5rem, 1.75)",
                  lineHeight: "clamp(1.5rem, 1.6rem, 1.75",
                }}
              >
                Hi <strong>User</strong>,
              </Text>
              <Text>
                Use the verification code below to proceed your sign up process
                :
              </Text>
            </Section>
            <Section className="my-[10dvh] text-center">
              <Text className="font-bold text-5xl text-blue-500 uppercase text-center space-x-10 tracking-[2rem]">
                verify
              </Text>
            </Section>
            <Hr className="w-full h-[1px] bg-gray-200" />
            <Section>
              <Text className="text-xs text-gray-700 text-justify">
                This email is was sent to you from{" "}
                <Link href="https://croom.vercel.app/">
                  {"(https://croom.vercel.app/)"}
                </Link>
                . if you did not expect an email from us reset your password and
                further secure your email address here{" "}
                <Link href="https://myaccount.google.com/u/1/security?hl=en">
                  {"(https://myaccount.google.com/u/1/security?hl=en)"}
                </Link>
                . And email us on <strong>croom.dev@gmail.com</strong> so we can
                delete your information in our system.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
