import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Section,
  Tailwind,
  Text,
} from '@react-email/components';

export default function SignUpEmail({
  username,
  code,
}: {
  username: string;
  code: string;
}) {
  return (
    <Html>
      <Tailwind>
        <Head />
        <Body className="bg-white">
          <Container
            className="border border-gray-200 border-solid rounded shadow-md w-full font-sans font-medium p-20"
            style={{ padding: 'clamp(0.5rem,1rem,1.25rem)' }}
          >
            <Heading className="text-center">
              <Text className=" text-5xl font-sans font-bold text-violet-700">
                Croom
              </Text>
              <Text className="font-medium text-slate-600   ">
                Connect and Hangout with your friends and Communities
              </Text>
            </Heading>
            <Section className="text-slate-800">
              <Text>
                Hi <strong>{username ? username : 'USER'}</strong>
              </Text>
              <Text>
                Welcome to <strong>Croom!</strong> Use the verification code
                below to proceed your sign up process:
              </Text>
            </Section>
            <Section className="my-[8dvh] mx-auto ">
              <Text className="font-bold text-5xl text-violet-900 uppercase text-center tracking-[2vw]">
                {code ? code : 'verify'}
              </Text>
            </Section>
            <Text className="text-xs">OTP will expire in 10 minutes.</Text>
            <Hr className="w-full h-[1px] bg-gray-200" />
            <Section>
              <Text className="text-xs text-slate-500 text-justify">
                This email is was sent to you from{' '}
                <Link href="https://www.chat-up.xyz/">
                  {'(https://www.chat-up.xyz/)'}
                </Link>
                . if you did not expect an email from us reset your password,
                further secure your email address and email us on{' '}
                <strong>croom.dev@gmail.com</strong> so we can delete your
                information in our system.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
