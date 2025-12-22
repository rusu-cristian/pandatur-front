import {
  Container,
  Title,
  Text,
  Box,
  Divider,
  DEFAULT_THEME,
  Flex,
  Image,
} from "@mantine/core";
import { getLanguageByKey } from "../Components/utils";

const LOGO = "/logo.png";

const convertMarkdownToHTML = (text) => {
  let replacedText = text;
  const tests = [
    {
      test: /\[([^\]]+)\]\((http[^\)]+)\)/g,
      text: '<a target="_blank" href="$2">$1</a>',
    },
    {
      test: /\{\{(.*?)\}\}/g,
      text: "<b>$1</b>",
    },
  ];

  tests.forEach(({ test, text }) => {
    replacedText = replacedText.replace(test, text);
  });

  return replacedText;
};

const gray = DEFAULT_THEME.colors.gray[7];

export const TermsAndConditions = () => {
  return (
    <Box h="100vh" style={{ overflowY: "scroll" }}>
      <Flex align="center" justify="center" h="75" bg="#1f2937">
        <Image
          className="pointer"
          height="40px"
          src={LOGO}
          alt="PANDATUR CRM"
        />
      </Flex>
      <Container py="20">
        <Box>
          <Title ta="center" order={2}>
            {getLanguageByKey("termsAndConditionsOfUsePandaTurSRL")}
          </Title>

          <Text ta="center">{getLanguageByKey("lastUpdate")}</Text>
        </Box>

        <Divider my="md" />

        <Box mb="md">
          <Text fw="bold" fs="italic">
            1. {`${getLanguageByKey("acceptanceOfTerms")}`}
          </Text>

          <Text
            c={gray}
            size="sm"
            style={{ whiteSpace: "pre-line", wordWrap: "break-word" }}
            dangerouslySetInnerHTML={{
              __html: convertMarkdownToHTML(
                getLanguageByKey(
                  "termsAndConditionsOfUsePandaTurSRLAcceptanceOfTerms",
                ),
              ),
            }}
          />
        </Box>

        <Box mb="md">
          <Text fw="bold" fs="italic">
            2. {`${getLanguageByKey("privacyPolicy")}`}
          </Text>

          <Text
            c={gray}
            size="sm"
            style={{ whiteSpace: "pre-line", wordWrap: "break-word" }}
            dangerouslySetInnerHTML={{
              __html: convertMarkdownToHTML(
                getLanguageByKey("privacyPolicyText"),
              ),
            }}
          />
        </Box>

        <Box mb="md">
          <Text fw="bold" fs="italic">
            3. {`${getLanguageByKey("serviceDescription")}`}
          </Text>

          <Text
            c={gray}
            size="sm"
            style={{ whiteSpace: "pre-line", wordWrap: "break-word" }}
            dangerouslySetInnerHTML={{
              __html: convertMarkdownToHTML(
                getLanguageByKey("serviceDescriptionText"),
              ),
            }}
          />
        </Box>

        <Box mb="md">
          <Text fw="bold" fs="italic">
            {`${getLanguageByKey("metaApiIntegration")}`}
          </Text>

          <Text
            c={gray}
            size="sm"
            style={{ whiteSpace: "pre-line", wordWrap: "break-word" }}
            dangerouslySetInnerHTML={{
              __html: convertMarkdownToHTML(
                getLanguageByKey("metaApiIntegrationDescription"),
              ),
            }}
          />
        </Box>

        <Box mb="md">
          <Text fw="bold" fs="italic">
            4. {`${getLanguageByKey("generalTermsOfUse")}`}
          </Text>

          <Text
            c={gray}
            size="sm"
            style={{ whiteSpace: "pre-line", wordWrap: "break-word" }}
            dangerouslySetInnerHTML={{
              __html: convertMarkdownToHTML(
                getLanguageByKey("pandaTurUsageRules"),
              ),
            }}
          />
        </Box>

        <Box mb="md">
          <Text fw="bold" fs="italic">
            5. {`${getLanguageByKey("accountsPasswordsAndSecurity")}`}
          </Text>

          <Text
            c={gray}
            size="sm"
            style={{ whiteSpace: "pre-line", wordWrap: "break-word" }}
            dangerouslySetInnerHTML={{
              __html: convertMarkdownToHTML(
                getLanguageByKey("userAccountSecurity"),
              ),
            }}
          />
        </Box>

        <Box mb="md">
          <Text fw="bold" fs="italic">
            6. {`${getLanguageByKey("limitationOfLiability")}`}
          </Text>

          <Text
            c={gray}
            size="sm"
            style={{ whiteSpace: "pre-line", wordWrap: "break-word" }}
            dangerouslySetInnerHTML={{
              __html: convertMarkdownToHTML(
                getLanguageByKey("pandaTurLiabilityLimitation"),
              ),
            }}
          />
        </Box>

        <Box mb="md">
          <Text fw="bold" fs="italic">
            7. {`${getLanguageByKey("advertisingAndThirdPartyLinks")}`}
          </Text>

          <Text
            c={gray}
            size="sm"
            style={{ whiteSpace: "pre-line", wordWrap: "break-word" }}
            dangerouslySetInnerHTML={{
              __html: convertMarkdownToHTML(
                getLanguageByKey("externalLinksAndAdvertising"),
              ),
            }}
          />
        </Box>

        <Box mb="md">
          <Text fw="bold" fs="italic">
            8. {`${getLanguageByKey("intellectualProperty")}`}
          </Text>

          <Text
            c={gray}
            size="sm"
            style={{ whiteSpace: "pre-line", wordWrap: "break-word" }}
            dangerouslySetInnerHTML={{
              __html: convertMarkdownToHTML(
                getLanguageByKey("copyrightAndIntellectualProperty"),
              ),
            }}
          />
        </Box>

        <Box mb="md">
          <Text fw="bold" fs="italic">
            9. {`${getLanguageByKey("disputeResolution")}`}
          </Text>

          <Text
            c={gray}
            size="sm"
            style={{ whiteSpace: "pre-line", wordWrap: "break-word" }}
            dangerouslySetInnerHTML={{
              __html: convertMarkdownToHTML(
                getLanguageByKey("disputeResolutionDetails"),
              ),
            }}
          />
        </Box>

        <Box mb="md">
          <Text fw="bold" fs="italic">
            10. {`${getLanguageByKey("modificationOfTerms")}`}
          </Text>

          <Text
            c={gray}
            size="sm"
            style={{ whiteSpace: "pre-line", wordWrap: "break-word" }}
            dangerouslySetInnerHTML={{
              __html: convertMarkdownToHTML(
                getLanguageByKey("modificationOfTermsDetails"),
              ),
            }}
          />
        </Box>

        <Box mb="md">
          <Text fw="bold" fs="italic">
            11. {`${getLanguageByKey("UsingMetaAPIs")}`}
          </Text>

          <Text
            c={gray}
            size="sm"
            style={{ whiteSpace: "pre-line", wordWrap: "break-word" }}
            dangerouslySetInnerHTML={{
              __html: convertMarkdownToHTML(
                getLanguageByKey("UsingMetaAPIsDetails"),
              ),
            }}
          />
        </Box>

        <Box>
          <Text fw="bold" fs="italic">
            12. {`${getLanguageByKey("contact")}`}
          </Text>

          <Text
            c={gray}
            size="sm"
            style={{ whiteSpace: "pre-line", wordWrap: "break-word" }}
            dangerouslySetInnerHTML={{
              __html: convertMarkdownToHTML(getLanguageByKey("contactDetails")),
            }}
          />
        </Box>
      </Container>
    </Box>
  );
};
