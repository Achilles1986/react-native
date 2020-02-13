#!/bin/bash
# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

function diskusage {
  # If the environment variable BLOCKSIZE is set, and the -k option is not
  # specified, the block counts will be displayed in units of that size block.
  # If BLOCKSIZE is not set, and the -k option is not specified, the block
  # counts will be displayed in 512-byte blocks.
  local path=$1
  du -s "$path" | awk "{size = \$0 * ${BLOCKSIZE:-512}} END {print size}"
}

function comment {
  local body=$1
  GITHUB_OWNER=${CIRCLE_PROJECT_USERNAME:-facebook} \
  GITHUB_REPO=${CIRCLE_PROJECT_REPONAME:-react-native} \
  GITHUB_PR_NUMBER="$CIRCLE_PR_NUMBER" \
  node bots/make-comment.js "$body"
}

case $1 in
  "android")
    # Outputs:
    #     RNTester (Android/hermes/arm64-v8a): 9437184 bytes
    #     RNTester (Android/hermes/armeabi-v7a): 9015296 bytes
    #     RNTester (Android/hermes/x86): 9498624 bytes
    #     RNTester (Android/hermes/x86_64): 9965568 bytes
    #     RNTester (Android/jsc/arm64-v8a): 9236480 bytes
    #     RNTester (Android/jsc/armeabi-v7a): 8814592 bytes
    #     RNTester (Android/jsc/x86): 9297920 bytes
    #     RNTester (Android/jsc/x86_64): 9764864 bytes
    eol=$'\n'
    size_report=""
    for engine in hermes jsc; do
      outputs="RNTester/android/app/build/outputs/apk/$engine/release"
      if [[ -d "$outputs" ]]; then
        for arch in arm64-v8a armeabi-v7a x86 x86_64; do
          apk="$outputs/app-$engine-$arch-release.apk"
          if [[ -f "$apk" ]]; then
            size_report+="RNTester (Android/$engine/$arch): $(diskusage "$apk") bytes$eol"
          else
            size_report+="RNTester (Android/$engine/$arch): n/a$eol"
          fi
        done
      fi
    done
    comment "$size_report"
    ;;
  "ios")
    # Outputs:
    #     RNTester.app (iOS): 9535488 bytes
    binary='RNTester/build/Build/Products/Release-iphonesimulator/RNTester.app/RNTester'
    if [[ -f "$binary" ]]; then
      comment "RNTester.app (iOS): $(diskusage "$binary") bytes"
    fi
    ;;
  *)
    echo "Syntax: $0 [android | ios]"
    exit 1
esac
